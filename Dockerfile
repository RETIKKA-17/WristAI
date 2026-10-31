# =====================================================================
# WristAI - FastAPI + PyTorch Backend Dockerfile for Railway Deployment
# =====================================================================
FROM python:3.11-slim

# Prevent Python from writing bytecode and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install minimal OS dependencies required by OpenCV and PIL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specifications
COPY requirements.txt .

# Install CPU-only PyTorch first to reduce container size and avoid CUDA bloat
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code, trained PyTorch model weights, and reference localization data
COPY backend/ ./backend/
COPY models/ ./models/
COPY data/ ./data/

# Create runtime directories for SQLite data store and uploaded radiographs
RUN mkdir -p /app/backend/uploads /app/backend/data_store

# Railway dynamically assigns $PORT
EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Production startup using Uvicorn bound to Railway's $PORT
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

