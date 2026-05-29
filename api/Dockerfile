FROM python:3.11-slim
ARG VERSION
WORKDIR /app

RUN apt-get update && apt-get install -y \
    libexpat1 \
    libgdal-dev \
    libproj-dev \
    libgeos-dev \
    libspatialindex-dev \
    libsqlite3-dev \
    libcurl4-openssl-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY api/pyproject.toml ./
COPY api/src ./src
RUN sed -i "s/^version = \".*\"/version = \"${VERSION}\"/" pyproject.toml
RUN pip install --no-cache-dir ./

EXPOSE 8000
CMD ["sh", "-c", "exec python -m src.run 2>&1"]
