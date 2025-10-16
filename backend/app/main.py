from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import vocab, vocablist, user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(vocab.router)
app.include_router(vocablist.router)
app.include_router(user.router)

@app.get("/")
def read_root():
    return {"msg": "Backend läuft mit Datenbank!"}