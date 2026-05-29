import logging
import os

from celery import Celery
from celery.signals import worker_init, worker_process_init

from src.config import get_settings

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
    worker_log_format='{"time": "%(asctime)s", "level": "%(levelname)s", "pid": %(process)d, "process": "%(processName)s", "name": "%(name)s", "message": "%(message)s"}',
    worker_task_log_format='{"time": "%(asctime)s", "level": "%(levelname)s", "pid": %(process)d, "process": "%(processName)s", "task": "%(task_name)s[%(task_id)s]", "message": "%(message)s"}',
)


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
