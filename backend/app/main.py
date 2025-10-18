from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.database import engine, Base
from app.routes import vocab, vocablist, user

app = FastAPI()

# CORS für Dev und produktive Domain zulassen
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

# API-Routen unter /api
app.include_router(vocab.router, prefix="/api")
app.include_router(vocablist.router, prefix="/api")
app.include_router(user.router, prefix="/api")

# Frontend-Build (Vite) ausliefern, falls vorhanden
frontend_dist = (Path(__file__).resolve().parents[2] / "frontend" / "dist").resolve()
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")

    # SPA-Fallback: Unbekannte Pfade an index.html zurückgeben
    index_file = frontend_dist / "index.html"

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"msg": "Frontend build not found"}
else:
    @app.get("/")
    def read_root():
        return {"msg": "Backend l��uft mit Datenbank!"}
