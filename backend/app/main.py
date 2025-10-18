from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.database import engine, Base
from app.routes import vocab, vocablist, user

app = FastAPI()

# CORS for dev and production domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://vocademy.onicssolutions.cc",
        "https://vocademy.onicssolutions.cc",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# API routes under /api
app.include_router(vocab.router, prefix="/api")
app.include_router(vocablist.router, prefix="/api")
app.include_router(user.router, prefix="/api")

# Frontend build paths
frontend_dist = (Path(__file__).resolve().parents[2] / "frontend" / "dist").resolve()
index_file = frontend_dist / "index.html"
assets_dir = frontend_dist / "assets"

# Serve Vite assets under /assets if they exist
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

# Root serves index.html if present (SPA), else backend info
@app.get("/", include_in_schema=False)
def root_html():
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"msg": "Backend läuft mit Datenbank!"}

# SPA fallback for client-side routes (non-API)
@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str, request: Request):
    # Do not intercept API routes
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not Found")
    # Serve index.html for any other path if build exists
    if index_file.exists():
        return FileResponse(str(index_file))
    raise HTTPException(status_code=404, detail="Not Found")

# Simple health/info endpoints under /api
@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api")
def api_root():
    return {"status": "ok", "routes": ["/api/login/", "/api/register/", "/api/vocablist/", "/api/health"]}

