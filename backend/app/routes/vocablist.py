from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import schemas, crud, database

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============== VokabelListe ==============
# Post new
@router.post("/vocablist/", response_model=schemas.VocabList)
def create_vocablist(item: schemas.VocabListCreate, db: Session = Depends(get_db)):
    return crud.create_vocab_list(db, item)

# Get All
@router.get("/vocablist/", response_model=list[schemas.VocabList])
def read_vocablist(db: Session = Depends(get_db)):
    return crud.get_vocab_list(db)
