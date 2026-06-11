from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from src.config import get_settings
from src.db import close_pool, init_pool
from src.redis import close_redis, init_redis
from src.exceptions import register
from src.geojson.router import router as geojson_router
from src.public_config.router import router as config_router
from src.status.router import router as status_router
from src.submit.router import router as submit_router

API_PREFIX = "/api"


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
        description=(
            "Analyse geospatial features against WHISP (What Is in my Plot) forest and land-use monitoring datasets.\n\n"
            "## Authentication\n"
            "All `/submit/*` and `/status/*` endpoints require an `x-api-key` header.\n\n"
            "## Response format\n"
            "Every response shares the same envelope:\n"
            "```json\n"
            "{\"code\": \"analysis_completed\", \"message\": \"...\", \"data\": [...]}\n"
            "```\n"
            "Error responses omit `data` and may include a `cause` field."
        ),
        openapi_tags=[
            {"name": "submit", "description": "Submit geometries for analysis (GeoJSON, WKT, or GeoIDs)"},
            {"name": "status", "description": "Poll or stream job status; cancel running jobs"},
            {"name": "geojson", "description": "Download completed results as GeoJSON or CSV"},
            {"name": "config", "description": "Public API configuration (limits, versions)"},
            {"name": "meta", "description": "Health check"},
        ],
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url=f"{API_PREFIX}/openapi.json",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register(app)
    app.include_router(config_router, prefix=API_PREFIX)
    app.include_router(submit_router, prefix=API_PREFIX)
    app.include_router(status_router, prefix=API_PREFIX)
    app.include_router(geojson_router, prefix=API_PREFIX)

    @app.get(f"{API_PREFIX}/docs", include_in_schema=False)
    async def swagger_ui() -> HTMLResponse:
        return get_swagger_ui_html(
            openapi_url=f"{API_PREFIX}/openapi.json",
            title="Whisp API",
            swagger_favicon_url="/favicon.ico",
        )

    @app.get(f"{API_PREFIX}/redoc", include_in_schema=False)
    async def redoc_ui() -> HTMLResponse:
        return get_redoc_html(
            openapi_url=f"{API_PREFIX}/openapi.json",
            title="Whisp API",
            redoc_favicon_url="/favicon.ico",
        )

    @app.get(f"{API_PREFIX}/health", tags=["meta"])
    async def health_response():
        return {"ok": True}

    Instrumentator().instrument(app).expose(app, include_in_schema=False)

    _orig_openapi = app.openapi

    def _openapi():
        schema = _orig_openapi()
        for path_item in schema.get("paths", {}).values():
            for op in path_item.values():
                if isinstance(op, dict):
                    op.get("responses", {}).pop("422", None)
        comps = schema.get("components", {}).get("schemas", {})
        comps.pop("HTTPValidationError", None)
        comps.pop("ValidationError", None)
        return schema

    app.openapi = _openapi

    return app


app = create_app()
