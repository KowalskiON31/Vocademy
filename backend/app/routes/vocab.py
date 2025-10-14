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

# ============== Vokabeln ==============
# Post new
@router.post("/vocab/", response_model=schemas.VocabItem)
def create_vocab(item: schemas.VocabItemCreate, db: Session = Depends(get_db)):
    return crud.create_vocab_item(db, item)

# Get All
@router.get("/vocab/", response_model=list[schemas.VocabItem])
def read_vocab(db: Session = Depends(get_db)):
    return crud.get_all_vocab_items(db)