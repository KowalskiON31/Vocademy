from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import schemas, crud, database, models
from app.routes.user import get_current_user

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
def create_vocab(
    item: schemas.VocabItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
    ):
    vocab_list = db.query(models.VocabList).filter(models.VocabList.id == item.vocab_list_id).first()

    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")

    if vocab_list.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Liste")

    return crud.create_vocab_item(db, item)

# Get All
@router.get("/vocab/", response_model=list[schemas.VocabItem])
def read_vocab(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
    ):
    user_lists = db.query(models.VocabList.id).filter(models.VocabList.user_id == current_user.id).all()
    list_ids = [l.id for l in user_lists]

    vocab_items = db.query(models.VocabItem).filter(models.VocabItem.vocab_list_id.in_(list_ids)).all()
    return vocab_items
