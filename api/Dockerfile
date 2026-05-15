FROM python:3.11-slim
WORKDIR /app

COPY api/pyproject.toml api/src/ ./api/
RUN pip install --no-cache-dir ./api/

COPY scripts/analysis/ ./scripts/analysis/
COPY db/ ./db/

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
