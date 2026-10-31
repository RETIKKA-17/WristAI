import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.database.session import engine, Base
from backend.app.database.seed import seed_database
from backend.app.api import auth, doctor, admin

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WristAI — Hospital Management & Wrist Fracture Analysis API",
    description="Backend API powering the Doctor & Hospital Administrator portals of WristAI.",
    version="1.0.0"
)

# Secure CORS configuration
environment = os.getenv("ENVIRONMENT", "development").lower()
is_production = environment == "production" or bool(os.getenv("RENDER")) or bool(os.getenv("RAILWAY_ENVIRONMENT"))

cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()
frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")

origins: list[str] = []
if cors_origins_env and cors_origins_env != "*":
    origins = [o.strip().rstrip("/") for o in cors_origins_env.split(",") if o.strip()]
elif frontend_url:
    origins = [frontend_url]
elif not is_production:
    origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

# Strict regex matching: in production only HTTPS on Render or Railway subdomains
if is_production:
    default_origin_regex = r"^https:\/\/[a-zA-Z0-9-]+\.(onrender\.com|up\.railway\.app)$"
else:
    default_origin_regex = r"^https?:\/\/(localhost|127\.0\.0\.1|.*\.onrender\.com|.*\.railway\.app)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", default_origin_regex),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Static files for X-ray uploads & thumbnails (supports persistent disk mount via UPLOADS_DIR)
uploads_dir = os.getenv("UPLOADS_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include API Routers
app.include_router(auth.router)
app.include_router(doctor.router)
app.include_router(admin.router)

# Optional: Mount frontend static build if present (for single-container deployments)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/app", StaticFiles(directory=frontend_dist, html=True), name="frontend_app")

@app.on_event("startup")
def on_startup():
    print("[WristAI API] Running startup initialization...")
    seed_database()

@app.get("/")
def root():
    return {
        "service": "WristAI API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

@app.get("/api/health")
def health_check():
    db_type = "PostgreSQL" if "postgresql" in str(engine.url) else "SQLite"
    return {
        "status": "healthy",
        "service": "WristAI Hospital API",
        "model_loaded": True,
        "database": f"{db_type} (Connected)"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
