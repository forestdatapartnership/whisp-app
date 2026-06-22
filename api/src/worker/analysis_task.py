import logging

from billiard.einfo import ExceptionInfo
from celery import Task
from celery.exceptions import TimeLimitExceeded
from celery.states import FAILURE, SUCCESS
from celery.worker.request import Request

from src.codes import SystemCode
from src.db import jobs as db_jobs
from src.db.pool import run_sync
from src.redis import publish_sync
from src.job_progress import JobProgress
from src.submit.schemas import AnalysisTaskContext

logger = logging.getLogger(__name__)


class AnalysisRequest(Request):
    # TODO remove, this is temp workaround until Celery 5.7
    def on_timeout(self, soft, timeout):
        ctx = AnalysisTask._task_context(self.args, self.kwargs)
        if ctx and self.task._already_terminal(ctx.token):
            super().on_timeout(soft, timeout)
            return

        exc = TimeLimitExceeded(timeout)
        einfo = None
        try:
            try:
                raise exc
            except TimeLimitExceeded:
                einfo = ExceptionInfo()

            self.task.on_failure(exc, self.id, self.args, self.kwargs, einfo)
            self.task.after_return(
                FAILURE, exc, self.id, self.args, self.kwargs, None,
            )
        finally:
            if einfo is not None:
                del einfo
            exc.__traceback__ = None

        super().on_timeout(soft, timeout)


class AnalysisTask(Task):
    Request = AnalysisRequest

    @classmethod
    def task_id_for(cls, token: str) -> str:
        return f"analysis-{token}"

    @staticmethod
    def _task_context(args: tuple, kwargs: dict) -> AnalysisTaskContext | None:
        return AnalysisTaskContext.from_task_message(args, kwargs)

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

    def before_start(self, task_id, args, kwargs):
        self._outcome: SystemCode | None = None
        self._error_message: str | None = None
        ctx = self._task_context(args, kwargs)
        if ctx is None:
            return
        logger.info("starting analysis...")
        run_sync(
            db_jobs.update_analysis_job,
            ctx.token,
            status=SystemCode.ANALYSIS_PROCESSING,
            started_at=db_jobs.utc_now(),
        )

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        ctx = self._task_context(args, kwargs)
        timeout = ctx.timeout if ctx else None

        if isinstance(exc, TimeLimitExceeded):
            self._outcome = SystemCode.ANALYSIS_TIMEOUT
            self._error_message = SystemCode.ANALYSIS_TIMEOUT.format(timeout)
        else:
            self._outcome = SystemCode.ANALYSIS_ERROR
            self._error_message = str(exc)

        super().on_failure(exc, task_id, args, kwargs, einfo)

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        ctx = self._task_context(args, kwargs)
        token = ctx.token if ctx else None
        if token is None or self._already_terminal(token):
            return

        if status == SUCCESS:
            outcome = SystemCode.ANALYSIS_COMPLETED
        else:
            outcome = self._outcome or SystemCode.ANALYSIS_ERROR

        error_message = self._error_message or None
        self._persist_terminal(token, outcome, error_message=error_message)

        if outcome == SystemCode.ANALYSIS_COMPLETED:
            logger.info("analysis completed")
        elif outcome == SystemCode.ANALYSIS_TIMEOUT:
            logger.warning("analysis timed out: %s", error_message or "unknown")
        else:
            logger.error("analysis failed: %s", error_message or "unknown")
