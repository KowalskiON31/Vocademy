from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud, database
from app.routes.user import get_current_user
from app.models import User

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
def create_vocablist(
    item: schemas.VocabListCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    return crud.create_vocab_list(db, item, current_user.id)

# Get All
@router.get("/vocablist/", response_model=list[schemas.VocabList])
def read_vocablist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    return crud.get_vocab_list(db, current_user.id)
