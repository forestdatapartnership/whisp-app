import logging
import threading

from celery import Task
from celery.exceptions import Ignore, SoftTimeLimitExceeded, TimeLimitExceeded, WorkerLostError
from celery.signals import task_failure
from celery.states import SUCCESS

from src.app_logging import bind
from src.codes import SystemCode
from src.db import jobs as db_jobs
from src.db.pool import run_sync
from src.redis import get_sync, publish_sync
from src.job_progress import JobProgress, timestamped
from src.submit.schemas import AnalysisTaskContext

logger = logging.getLogger(__name__)


class AnalysisTask(Task):
    @classmethod
    def task_id_for(cls, token: str) -> str:
        return f"analysis-{token}"

    def _persist_terminal(
        self,
        token: str,
        status: SystemCode,
        error_message: str | None = None,
    ) -> None:
        run_sync(db_jobs.update_analysis_job, token, status=status, completed_at=db_jobs.utc_now(), error_message=error_message)
        publish_sync(
            token,
            JobProgress.of(status, error_message=error_message).to_redis(),
        )

    def _already_terminal(self, token: str) -> bool:
        job = run_sync(db_jobs.get_job, token)
        if not job:
            return False
        return job.get("status") in {
            SystemCode.ANALYSIS_COMPLETED.value,
            SystemCode.ANALYSIS_CANCELLED.value,
            SystemCode.ANALYSIS_TIMEOUT.value,
            SystemCode.ANALYSIS_ERROR.value,
        }

    def _persist_in_background(self, ctx: AnalysisTaskContext, status: SystemCode, error_message: str | None) -> None:
        # For failures Celery reports in the main worker process. On its own thread, a database outage would block
        # the worker, and the pool children it forks would inherit the connections.
        def persist() -> None:
            bind(token=ctx.token, user_id=ctx.user_id, api_key_id=ctx.api_key_id, input_metrics=ctx.input_metrics)
            try:
                if not self._already_terminal(ctx.token):
                    self._persist_terminal(ctx.token, status, error_message=error_message)
            except Exception:
                logger.exception("failed to persist analysis failure")

        threading.Thread(target=persist, name=f"analysis-failure-{ctx.token}", daemon=True).start()

    def before_start(self, task_id, args, kwargs):
        self._outcome: SystemCode | None = None
        self._error_message: str | None = None
        ctx = AnalysisTaskContext.from_task_message(args, kwargs)
        if ctx is None:
            return
        if self._already_terminal(ctx.token):
            raise Ignore()
        logger.info("starting analysis...")
        run_sync(
            db_jobs.update_analysis_job,
            ctx.token,
            status=SystemCode.ANALYSIS_PROCESSING,
            started_at=db_jobs.utc_now(),
        )

        queue = self.request.delivery_info["routing_key"]
        for position, row in enumerate(run_sync(db_jobs.list_queued_jobs, queue), start=1):
            job = JobProgress.from_db(row)
            state = get_sync(job.id) or {}
            publish_sync(
                job.id,
                JobProgress.of(
                    SystemCode.ANALYSIS_QUEUED,
                    feature_count=job.feature_count,
                    mode=job.mode,
                    messages=[*(state.get("messages") or []), timestamped(f"Position {position} in queue")],
                ).to_redis(),
            )

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        ctx = AnalysisTaskContext.from_task_message(args, kwargs)
        timeout = ctx.timeout if ctx else None

        if isinstance(exc, (SoftTimeLimitExceeded, TimeLimitExceeded)):
            self._outcome = SystemCode.ANALYSIS_TIMEOUT
            self._error_message = SystemCode.ANALYSIS_TIMEOUT.format(timeout)
            if ctx is not None:
                # A hard time limit runs this in the main worker process, without the task's log context
                bind(token=ctx.token, user_id=ctx.user_id, api_key_id=ctx.api_key_id, input_metrics=ctx.input_metrics)
            logger.warning("analysis timed out: %s", self._error_message)
        else:
            self._outcome = SystemCode.ANALYSIS_ERROR
            self._error_message = str(exc)

        super().on_failure(exc, task_id, args, kwargs, einfo)

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        ctx = AnalysisTaskContext.from_task_message(args, kwargs)
        if ctx is None:
            return
        if isinstance(retval, TimeLimitExceeded):
            # A hard time limit calls this in the main worker process, right after on_failure
            self._persist_in_background(ctx, self._outcome, self._error_message)
            return
        if self._already_terminal(ctx.token):
            return

        if status == SUCCESS:
            outcome = SystemCode.ANALYSIS_COMPLETED
        else:
            outcome = self._outcome or SystemCode.ANALYSIS_ERROR

        error_message = self._error_message or None
        self._persist_terminal(ctx.token, outcome, error_message=error_message)


@task_failure.connect
def _fail_lost_analysis(sender=None, exception=None, args=None, kwargs=None, **_):
    # Celery calls this in the main worker process when the analysis process is killed, e.g. for exceeding
    # the memory limit; the task's own handlers die with that process
    if not (isinstance(sender, AnalysisTask) and isinstance(exception, WorkerLostError)):
        return
    ctx = AnalysisTaskContext.from_task_message(args, kwargs)
    if ctx is not None:
        sender._persist_in_background(
            ctx,
            SystemCode.ANALYSIS_ERROR,
            "The analysis stopped unexpectedly, most likely because it ran out of memory. "
            "Please try again with fewer or smaller plots.",
        )
