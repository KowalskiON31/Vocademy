
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from app import schemas, crud, database, models
from app.auth import get_current_user_from_token
from app.auth import verify_access_token
from app.models import User

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")

# ============== VokabelListe ==============
# Post new
@router.post("/vocablist/", response_model=schemas.VocabList)
def create_vocablist(
    item: schemas.VocabListCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    return crud.create_vocab_list(db, item, user.id)

# Get one
@router.get("/vocablist/{vocab_id}", response_model=schemas.VocabList)
def get_vocablist(
    vocab_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")

    return crud.get_vocab_list(db, vocab_id)

# Get All
@router.get("/vocablist/", response_model=list[schemas.VocabList])
def read_vocablist(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    return crud.get_vocab_list_by_user(db, user.id)
