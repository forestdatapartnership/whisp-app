from contextlib import contextmanager
from typing import Iterator

from src.schemas import EarthEngineInput

EE_STANDARD_URL = "https://earthengine.googleapis.com"
EE_HIGH_VOLUME_URL = "https://earthengine-highvolume.googleapis.com"


def earth_engine_api_url(async_mode: bool) -> str:
    return EE_HIGH_VOLUME_URL if async_mode else EE_STANDARD_URL


def initialize_earth_engine(caller: EarthEngineInput, async_mode: bool) -> None:
    import ee
    from google.oauth2 import credentials, service_account

    if caller.accessToken is not None:
        ee_credentials = credentials.Credentials(caller.accessToken.get_secret_value())
    else:
        ee_credentials = service_account.Credentials.from_service_account_info(
            caller.task_payload()["serviceAccount"],
            scopes=["https://www.googleapis.com/auth/earthengine"],
        )
    ee.Initialize(
        credentials=ee_credentials,
        project=caller.project,
        url=earth_engine_api_url(async_mode),
    )


@contextmanager
def caller_earth_engine_session(caller_payload: dict, async_mode: bool) -> Iterator[None]:
    import ee

    caller = EarthEngineInput.model_validate(caller_payload)
    ee.Reset()
    try:
        initialize_earth_engine(caller, async_mode)
        yield
    finally:
        ee.Reset()
