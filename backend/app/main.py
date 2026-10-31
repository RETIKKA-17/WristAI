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

# CORS configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
if cors_origins_env == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.railway\.app|http://localhost:.*|http://127\.0\.0\.1:.*"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for X-ray uploads & thumbnails
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
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
