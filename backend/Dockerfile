# Backend Dockerfile for FastAPI app

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (for building python deps like asyncpg)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# Copy application code
COPY . /app

EXPOSE 8000

# Uvicorn server - use PORT environment variable or default to 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}


