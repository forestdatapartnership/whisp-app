import uvicorn

from src.app_logging import log_config_dict
from src.config import get_settings


def main(*, reload: bool = False) -> None:
    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=reload,
        log_level=settings.log_level,
        log_config=log_config_dict(),
        timeout_keep_alive=65,
    )

if __name__ == "__main__":
    main()
