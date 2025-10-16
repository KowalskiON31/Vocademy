from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")

# ============== Entries ==============
@router.post("/vocab/entries", response_model=schemas.VocabEntry)
def create_entry(
    item: schemas.VocabEntryCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    vocab_list = db.query(models.VocabList).filter(models.VocabList.id == item.vocab_list_id).first()
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Liste")

    return crud.create_vocab_entry(db, item)


@router.get("/vocab/entries", response_model=list[schemas.VocabEntry])
def list_entries(
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
    return crud.get_vocab_list_entries(db, list_ids)


@router.get("/vocab/entries/list/{list_id}", response_model=list[schemas.VocabEntry])
def get_entries_by_list(
    list_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")

    vocab_list = db.query(models.VocabList).filter(models.VocabList.id == list_id).first()
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Liste")

    from sqlalchemy.orm import joinedload
    entries = db.query(models.VocabEntry).options(joinedload(models.VocabEntry.translations)).filter(models.VocabEntry.vocab_list_id == list_id).all()
    return entries


@router.get("/vocab/entries/{entry_id}", response_model=schemas.VocabEntry)
def get_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    entry = crud.get_vocab_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    if entry.vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diesen Eintrag")
    return entry


@router.put("/vocab/entries/{entry_id}", response_model=schemas.VocabEntry)
def update_entry(
    entry_id: int,
    data: schemas.VocabEntryUpdate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    entry = crud.get_vocab_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    if entry.vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diesen Eintrag")
    updated = crud.update_vocab_entry(db, entry_id, data)
    return updated


@router.delete("/vocab/entries/{entry_id}")
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    entry = crud.get_vocab_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    if entry.vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diesen Eintrag")
    ok = crud.delete_vocab_entry(db, entry_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    return {"message": "Eintrag gelöscht"}


# ============== Translations ==============
@router.post("/vocab/entries/{entry_id}/translations", response_model=schemas.VocabTranslation)
def create_translation(
    entry_id: int,
    tr: schemas.VocabTranslationCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    entry = crud.get_vocab_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    if entry.vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diesen Eintrag")
    return crud.add_translation(db, entry_id, tr)


@router.put("/vocab/translations/{translation_id}", response_model=schemas.VocabTranslation)
def update_translation(
    translation_id: int,
    tr: schemas.VocabTranslationCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    # Ownership check by joining via entry
    trans = db.query(models.VocabTranslation).filter(models.VocabTranslation.id == translation_id).first()
    if not trans:
        raise HTTPException(status_code=404, detail="Übersetzung nicht gefunden")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    if trans.entry.vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Übersetzung")
    updated = crud.update_translation(db, translation_id, tr)
    if not updated:
        raise HTTPException(status_code=404, detail="Übersetzung nicht gefunden")
    return updated


@router.delete("/vocab/translations/{translation_id}")
def delete_translation(
    translation_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    trans = db.query(models.VocabTranslation).filter(models.VocabTranslation.id == translation_id).first()
    if not trans:
        raise HTTPException(status_code=404, detail="Übersetzung nicht gefunden")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    if trans.entry.vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Übersetzung")
    ok = crud.delete_translation(db, translation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Übersetzung nicht gefunden")
    return {"message": "Übersetzung gelöscht"}


# ============== Tabellarische Ansicht ==============
@router.get("/vocab/entries/table")
def list_entries_as_table(
    vocab_list_id: int,
    langs: Optional[list[str]] = Query(default=None),
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
    ):
    """
    Gibt die Einträge einer Liste in tabellarischer Form zurück.
    Spalten: term, source_language, sowie je Sprache ein Feld (z.B. 'en', 'es', ...).
    """
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=404, detail="User nicht gefunden")

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")

    vocab_list = db.query(models.VocabList).filter(models.VocabList.id == vocab_list_id).first()
    if not vocab_list:
        raise HTTPException(status_code=404, detail="Vokabelliste nicht gefunden")
    if vocab_list.user_id != user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung für diese Liste")

    from sqlalchemy.orm import joinedload
    entries = db.query(models.VocabEntry).options(joinedload(models.VocabEntry.translations)).filter(models.VocabEntry.vocab_list_id == vocab_list_id).all()

    # Handle optional langs parameter
    normalized_langs = []
    if langs:
        normalized_langs = [l.strip() for l in langs if l and l.strip()]
    
    rows = []
    for e in entries:
        row = {
            "term": e.term,
            "source_language": e.source_language,
            "entry_id": e.id,
        }
        # Build language columns
        if normalized_langs:
            for lang in normalized_langs:
                val = next((t.text for t in e.translations if (t.language or "").lower() == lang.lower()), None)
                row[lang] = val
        else:
            # If no langs specified, include all languages present for this entry
            for t in e.translations:
                key = (t.language or "").lower() or "_"
                row[key] = t.text
        rows.append(row)

    return rows
