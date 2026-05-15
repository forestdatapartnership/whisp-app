FROM python:3.11-slim
WORKDIR /app

COPY api/pyproject.toml ./
COPY api/src ./src
RUN pip install --no-cache-dir ./

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
