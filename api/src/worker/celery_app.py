import logging
import os

from celery import Celery
from celery.signals import (
    setup_logging,
    task_failure,
    task_postrun,
    task_prerun,
    worker_init,
    worker_process_init,
)

from src.app_logging import bind, clear_context, configure
from src.config import get_settings
from src.submit.schemas import AnalysisTaskContext

logger = logging.getLogger(__name__)

settings = get_settings()
app = Celery(
    "whisp",
    broker=settings.redis_url,
)
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_send_task_events=True,
    task_send_sent_event=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    broker_transport_options={
        "socket_timeout": 30,
        "socket_connect_timeout": 30,
        "retry_on_timeout": True,
        "health_check_interval": 30,
    },
    worker_cancel_long_running_tasks_on_connection_loss=True,
)


@setup_logging.connect
def _setup_logging(**kwargs):
    configure()


@task_prerun.connect
def _bind_task_log_context(
    task_id: str | None = None,
    task=None,
    args: tuple | None = None,
    kwargs: dict | None = None,
    **_,
):
    ctx = AnalysisTaskContext.from_task_message(args, kwargs)
    bind(
        task_id=task_id,
        task_name=task.name if task else None,
        token=ctx.token if ctx else None,
        user_id=ctx.user_id if ctx else None,
        api_key_id=ctx.api_key_id if ctx else None,
        feature_count=ctx.feature_count if ctx else None,
    )


@task_postrun.connect
@task_failure.connect
def _clear_task_log_context(**_):
    clear_context()


@worker_init.connect
@worker_process_init.connect
def _init_worker(sender=None, **kwargs):
    import openforis_whisp as whisp

    high_vol = os.environ.get("EE_HIGH_VOL") == "1"
    cred_path = str(settings.ee_credential_path.resolve())
    whisp.initialize_ee(cred_path, use_high_vol_endpoint=high_vol)
    logger.info(
        "EE initialized (endpoint=%s, pid=%d)",
        "high-volume" if high_vol else "standard",
        os.getpid(),
    )


import src.worker.tasks  # noqa: E402, F401 — register tasks
