from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login/")


def get_current_user(token: str, db: Session) -> models.User:
    """Helper function to get current user from token"""
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="UngÃ¼ltiger Token")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    return user


# ============== VOCAB ENTRIES ==============
@router.post("/vocab/entries", response_model=schemas.VocabEntry)
def create_entry(
    item: schemas.VocabEntryCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Erstellt einen neuen Vokabeleintrag.
    
    Beispiel Request Body:
    {
        "vocab_list_id": 1,
        "field_values": [
            {"column_id": 1, "value": "Analgetikum"},
            {"column_id": 2, "value": "Schmerzmittel"},
            {"column_id": 3, "value": "Medikament zur Schmerzlinderung"},
            {"column_id": 4, "value": "Wird bei Kopfschmerzen eingesetzt"}
        ]
    }
    """
    user = get_current_user(token, db)
    
    vocab_list = db.query(models.VocabList).filter(
        models.VocabList.id == item.vocab_list_id
    ).first()
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung fÃ¼r diese Liste")

    return crud.create_vocab_entry(db, item)


@router.get("/vocab/entries/list/{list_id}", response_model=list[schemas.VocabEntry])
def get_entries_by_list(
    list_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Gibt alle EintrÃ¤ge einer Liste zurÃ¼ck"""
    user = get_current_user(token, db)

    vocab_list = db.query(models.VocabList).filter(models.VocabList.id == list_id).first()
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung fÃ¼r diese Liste")

    entries = crud.get_vocab_list_entries(db, list_id)
    return entries


@router.get("/vocab/entries/{entry_id}", response_model=schemas.VocabEntry)
def get_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Gibt einen spezifischen Eintrag zurÃ¼ck"""
    user = get_current_user(token, db)
    
    entry = crud.get_vocab_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    
    if entry.vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung fÃ¼r diesen Eintrag")
    
    return entry


@router.put("/vocab/entries/{entry_id}", response_model=schemas.VocabEntry)
def update_entry(
    entry_id: int,
    data: schemas.VocabEntryUpdate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Aktualisiert einen Vokabeleintrag.
    
    Beispiel Request Body:
    {
        "field_values": [
            {"column_id": 1, "value": "Analgetikum (aktualisiert)"},
            {"column_id": 2, "value": "Schmerzmittel"},
            {"column_id": 3, "value": "Neue Definition"},
            {"column_id": 4, "value": "Neues Beispiel"}
        ]
    }
    """
    user = get_current_user(token, db)
    
    entry = crud.get_vocab_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    
    if entry.vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung fÃ¼r diesen Eintrag")
    
    updated = crud.update_vocab_entry(db, entry_id, data)
    return updated


@router.delete("/vocab/entries/{entry_id}")
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """LÃ¶scht einen Vokabeleintrag"""
    user = get_current_user(token, db)
    
    entry = crud.get_vocab_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    
    if entry.vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung fÃ¼r diesen Eintrag")
    
    crud.delete_vocab_entry(db, entry_id)
    return {"message": "Eintrag gelÃ¶scht"}
