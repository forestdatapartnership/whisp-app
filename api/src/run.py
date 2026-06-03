import os

import uvicorn

from src.app_logging import log_config_dict
from src.config import get_settings


def main(*, reload: bool = False) -> None:
    settings = get_settings()
    port = int(os.environ.get("API_PORT", "8000"))
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=port,
        reload=reload,
        log_level=settings.log_level,
        log_config=log_config_dict(),
        timeout_keep_alive=65,
    )

if __name__ == "__main__":
    main()
