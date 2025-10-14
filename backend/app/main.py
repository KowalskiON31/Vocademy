from fastapi import FastAPI
from app.database import engine, Base
from app.routes import vocab, vocablist, user

app = FastAPI()
Base.metadata.create_all(bind=engine)

app.include_router(vocab.router)
app.include_router(vocablist.router)
app.include_router(user.router)

@app.get("/")
def read_root():
    return {"msg": "Backend läuft mit Datenbank!"}