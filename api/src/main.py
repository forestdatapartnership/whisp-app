import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pythonjsonlogger import jsonlogger

from src.config import get_settings
from src.db import close_pool, init_pool
from src.redis import close_redis, init_redis
from src.exceptions import register
from src.geojson.router import router as geojson_router
from src.public_config.router import router as config_router
from src.status.router import router as status_router
from src.submit.router import router as submit_router

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(jsonlogger.JsonFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler])


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_pool()
    await init_redis()
    try:
        yield
    finally:
        await close_redis()
        await close_pool()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Whisp API",
        version=settings.api_version,
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register(app)
    app.include_router(config_router)
    app.include_router(config_router, prefix="/api", include_in_schema=False)
    app.include_router(submit_router)
    app.include_router(submit_router, prefix="/api", include_in_schema=False)
    app.include_router(status_router)
    app.include_router(status_router, prefix="/api", include_in_schema=False)
    app.include_router(geojson_router)
    app.include_router(geojson_router, prefix="/api", include_in_schema=False)

    @app.get("/health", tags=["meta"])
    @app.get("/api/health", tags=["meta"], include_in_schema=False)
    async def health_response():
        return {"ok": True}

    Instrumentator().instrument(app).expose(app, include_in_schema=False)

    return app


app = create_app()
