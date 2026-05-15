import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pythonjsonlogger import jsonlogger

from src.config import get_settings
from src.db import close_pool, init_pool
from src.exceptions import register
from src.status.router import router as status_router
from src.submit.router import router as submit_router

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(jsonlogger.JsonFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler])


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_pool()
    try:
        yield
    finally:
        await close_pool()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="Whisp API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register(app)
    app.include_router(submit_router)
    app.include_router(submit_router, prefix="/api", include_in_schema=False)
    app.include_router(status_router)
    app.include_router(status_router, prefix="/api", include_in_schema=False)

    async def health_response() -> dict:
        return {"ok": True}

    app.get("/health", tags=["meta"])(health_response)
    app.get("/api/health", tags=["meta"], include_in_schema=False)(health_response)

    Instrumentator().instrument(app).expose(app, include_in_schema=False)

    return app


app = create_app()
