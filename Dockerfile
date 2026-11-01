# =====================================================================
# WristAI - FastAPI + PyTorch Backend Dockerfile for Production Deployment
# Supports: Render (PORT=10000) & Railway (PORT dynamic)
# =====================================================================
FROM python:3.11-slim

# Prevent Python from writing bytecode and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    MALLOC_ARENA_MAX=2 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    VECLIB_MAXIMUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1

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

# Self-healing check: Ensure wrist_fracture_model.pth is the real 134MB binary and not an unpulled Git LFS pointer text file
RUN if [ $(wc -c < "/app/models/wrist_fracture_model.pth") -lt 1000000 ]; then \
        echo "[Docker Build] Detected Git LFS pointer. Downloading 134MB model weights from GitHub LFS..." && \
        curl -fSL -o /app/models/wrist_fracture_model.pth https://media.githubusercontent.com/media/RETIKKA-17/WristAI/main/models/wrist_fracture_model.pth; \
    fi && \
    echo "[Docker Build] Verified model weight size: $(wc -c < /app/models/wrist_fracture_model.pth) bytes"

# Optimize model checkpoint (strip 90MB training optimizer states) and build SIFT reference cache
RUN python3 -c "import torch; ckpt = torch.load('/app/models/wrist_fracture_model.pth', map_location='cpu'); torch.save({'model_state_dict': ckpt['model_state_dict']}, '/app/models/wrist_fracture_model.pth')" && \
    python3 -c "from backend.app.services.localization_service import generate_sift_cache; generate_sift_cache('/app/data/sift_reference_cache.npz')" && \
    echo "[Docker Build] Post-optimization model weight size: $(wc -c < /app/models/wrist_fracture_model.pth) bytes"

# Create runtime directories for SQLite data store and uploaded radiographs
RUN mkdir -p /app/backend/uploads /app/backend/data_store

# Dynamic port exposure
EXPOSE 10000 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/api/health || exit 1

# Production startup using Uvicorn bound to Render/Railway dynamic $PORT
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]

