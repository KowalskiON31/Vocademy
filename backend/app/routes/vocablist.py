from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
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


def get_current_user(token: str, db: Session) -> models.User:
    """Helper function to get current user from token"""
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Ungültiger Token")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    return user


# ============== VOCAB LISTS ==============
@router.post("/vocablist/", response_model=schemas.VocabList)
def create_vocablist(
    item: schemas.VocabListCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Erstellt eine neue Vokabelliste mit konfigurierbaren Spalten.
    
    Beispiel Request Body:
    {
        "name": "Medizinische Fachbegriffe",
        "description": "PTA Schule",
        "columns": [
            {"name": "Fachbegriff", "column_type": "custom", "position": 0, "is_primary": true},
            {"name": "Lateinisch", "column_type": "custom", "position": 1},
            {"name": "Definition", "column_type": "definition", "position": 2},
            {"name": "Anwendung", "column_type": "example", "position": 3}
        ]
    }
    """
    user = get_current_user(token, db)
    return crud.create_vocab_list(db, item, user.id)


@router.get("/vocablist/", response_model=list[schemas.VocabList])
def get_all_vocablists(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Gibt alle Vokabellisten des aktuellen Users zurück"""
    user = get_current_user(token, db)
    return crud.get_vocab_list_by_user(db, user.id)


@router.get("/vocablist/{vocab_id}", response_model=schemas.VocabList)
def get_vocablist(
    vocab_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Gibt eine spezifische Vokabelliste zurück"""
    user = get_current_user(token, db)
    
    vocab_list = crud.get_vocab_list(db, vocab_id)
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Liste")
    
    return vocab_list


@router.put("/vocablist/{vocab_id}", response_model=schemas.VocabList)
def update_vocablist(
    vocab_id: int,
    item: schemas.VocabListUpdate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Aktualisiert Name/Beschreibung einer Vokabelliste"""
    user = get_current_user(token, db)
    
    vocab_list = crud.get_vocab_list(db, vocab_id)
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Liste")
    
    updated = crud.update_vocab_list(db, vocab_id, item)
    return updated


@router.delete("/vocablist/{vocab_id}")
def delete_vocablist(
    vocab_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Löscht eine Vokabelliste"""
    user = get_current_user(token, db)
    
    vocab_list = crud.get_vocab_list(db, vocab_id)
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Liste")
    
    crud.delete_vocab_list(db, vocab_id)
    return {"message": "Vokabelliste wurde gelöscht"}


# ============== LIST COLUMNS ==============
@router.post("/vocablist/{vocab_id}/columns", response_model=schemas.ListColumn)
def add_column_to_list(
    vocab_id: int,
    column: schemas.ListColumnCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Fügt eine neue Spalte zu einer existierenden Liste hinzu.
    
    Beispiel: {"name": "Beispielsatz", "column_type": "example", "position": 4}
    """
    user = get_current_user(token, db)
    
    vocab_list = crud.get_vocab_list(db, vocab_id)
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Liste")
    
    new_column = crud.add_column_to_list(db, vocab_id, column)
    return new_column


@router.delete("/vocablist/columns/{column_id}")
def delete_column(
    column_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Löscht eine Spalte (und alle zugehörigen Werte)"""
    user = get_current_user(token, db)
    
    column = db.query(models.ListColumn).filter(models.ListColumn.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Spalte nicht gefunden")
    
    # Check ownership via vocab_list
    vocab_list = crud.get_vocab_list(db, column.vocab_list_id)
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    crud.delete_column(db, column_id)
    return {"message": "Spalte wurde gelöscht"}