from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app import schemas, crud, database, models
from app.auth import verify_access_token

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")

# ============== Vokabeln ==============
# Post new
@router.post("/vocab/", response_model=schemas.VocabItem)
def create_vocab(
    item: schemas.VocabItemCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    vocab_list = db.query(models.VocabList).filter(models.VocabList.id == item.vocab_list_id).first()

    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")

    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Liste")

    return crud.create_vocab_item(db, item)

# Get All
@router.get("/vocab/", response_model=list[schemas.VocabItem])
def read_vocab(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    user_lists = db.query(models.VocabList.id).filter(models.VocabList.user_id == user.id).all()
    list_ids = [l.id for l in user_lists]

    vocab_items = db.query(models.VocabItem).filter(models.VocabItem.vocab_list_id.in_(list_ids)).all()
    return vocab_items
