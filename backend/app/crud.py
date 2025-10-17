from sqlalchemy.orm import Session
from app import models, schemas, auth
from fastapi import HTTPException, status
from app.auth import hash_password

# ============== USER ==============
def create_user(db: Session, user: schemas.UserCreate):
    # Check if email already exists
    existing_email = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email bereits registriert")
    
    hashed_pw = hash_password(user.password)

    new_user = models.User(
        username=user.username.strip(),
        email=user.email.strip(),
        password=hashed_pw,
        role="User",
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_users(db: Session):
    return db.query(models.User).all()


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def update_user(db: Session, user_id: int, updated_data: schemas.UserUpdate, current_user: models.User):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Zieluser nicht gefunden")

    if current_user.role != "Admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Kein Zugriff!")

    if updated_data.username and updated_data.username.strip():
        user.username = updated_data.username.strip()
    
    if updated_data.email and updated_data.email.strip():
        # Check if email is already taken by another user
        existing = db.query(models.User).filter(
            models.User.email == updated_data.email.strip(),
            models.User.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email bereits vergeben")
        user.email = updated_data.email.strip()

    if updated_data.role and updated_data.role.strip():
        if current_user.role != "Admin":
            raise HTTPException(status_code=403, detail="Nur Admins dürfen Rollen ändern")
        user.role = updated_data.role.strip()

    if updated_data.is_active is not None:
        if current_user.role != "Admin":
            raise HTTPException(status_code=403, detail="Nur Admins dürfen Benutzer deaktivieren")
        user.is_active = updated_data.is_active

    db.commit()
    db.refresh(user)
    return user


def deactivate_user(db: Session, user_id: int, current_user: models.User):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Benutzer deaktivieren")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Benutzer ist bereits deaktiviert")

    user.is_active = False
    db.commit()
    db.refresh(user)
    return {"message": f"Benutzer '{user.username}' wurde deaktiviert."}


def delete_user(db: Session, user_id: int, current_user: models.User):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Benutzer löschen")

    if current_user.id == user.id:
        raise HTTPException(status_code=400, detail="Admins können sich nicht selbst löschen")

    db.delete(user)
    db.commit()
    return {"message": f"Benutzer '{user.username}' wurde gelöscht."}


# ============== VOCAB LISTS ==============
def create_vocab_list(db: Session, vocablist_data: schemas.VocabListCreate, user_id: int):
    """
    Erstellt eine neue Vokabelliste mit konfigurierbaren Spalten.
    """
    new_vocab_list = models.VocabList(
        name=vocablist_data.name,
        description=vocablist_data.description,
        user_id=user_id
    )
    db.add(new_vocab_list)
    db.flush()  # Get ID for columns
    
    # Create columns
    for col_data in vocablist_data.columns:
        column = models.ListColumn(
            vocab_list_id=new_vocab_list.id,
            name=col_data.name,
            column_type=col_data.column_type,
            language_code=col_data.language_code,
            position=col_data.position,
            is_primary=col_data.is_primary
        )
        db.add(column)
    
    db.commit()
    db.refresh(new_vocab_list)
    return new_vocab_list


def get_vocab_list_by_user(db: Session, user_id: int):
    """
    Gibt alle Vokabellisten eines bestimmten Users aus.
    """
    from sqlalchemy.orm import joinedload
    return db.query(models.VocabList).options(
        joinedload(models.VocabList.columns)
    ).filter(models.VocabList.user_id == user_id).all()


def get_vocab_list(db: Session, vocablist_id: int):
    """
    Gibt Vokabelliste einer bestimmten ID aus.
    """
    from sqlalchemy.orm import joinedload
    return db.query(models.VocabList).options(
        joinedload(models.VocabList.columns),
        joinedload(models.VocabList.entries)
    ).filter(models.VocabList.id == vocablist_id).first()


def update_vocab_list(db: Session, vocablist_id: int, data: schemas.VocabListUpdate):
    """
    Aktualisiert Name/Beschreibung einer Liste.
    """
    vocab_list = get_vocab_list(db, vocablist_id)
    if not vocab_list:
        return None
    
    if data.name is not None:
        vocab_list.name = data.name
    if data.description is not None:
        vocab_list.description = data.description
    
    db.commit()
    db.refresh(vocab_list)
    return vocab_list


def delete_vocab_list(db: Session, vocablist_id: int):
    """
    Löscht eine Vokabelliste.
    """
    vocab_list = get_vocab_list(db, vocablist_id)
    if not vocab_list:
        return False
    db.delete(vocab_list)
    db.commit()
    return True


# ============== LIST COLUMNS ==============
def add_column_to_list(db: Session, list_id: int, column_data: schemas.ListColumnCreate):
    """
    Fügt eine neue Spalte zu einer existierenden Liste hinzu.
    """
    vocab_list = get_vocab_list(db, list_id)
    if not vocab_list:
        return None
    
    # Get next position
    max_pos = db.query(models.ListColumn).filter(
        models.ListColumn.vocab_list_id == list_id
    ).count()
    
    column = models.ListColumn(
        vocab_list_id=list_id,
        name=column_data.name,
        column_type=column_data.column_type,
        language_code=column_data.language_code,
        position=column_data.position if column_data.position else max_pos,
        is_primary=column_data.is_primary
    )
    db.add(column)
    db.commit()
    db.refresh(column)
    return column


def delete_column(db: Session, column_id: int):
    """
    Löscht eine Spalte (und alle zugehörigen Feldwerte).
    """
    column = db.query(models.ListColumn).filter(models.ListColumn.id == column_id).first()
    if not column:
        return False
    db.delete(column)
    db.commit()
    return True


# ============== VOCAB ENTRIES ==============
def create_vocab_entry(db: Session, data: schemas.VocabEntryCreate):
    """
    Erstellt einen Vokabeleintrag mit Feldwerten.
    """
    # Get next position
    max_pos = db.query(models.VocabEntry).filter(
        models.VocabEntry.vocab_list_id == data.vocab_list_id
    ).count()
    
    entry = models.VocabEntry(
        vocab_list_id=data.vocab_list_id,
        position=max_pos
    )
    db.add(entry)
    db.flush()
    
    # Add field values
    for field_data in data.field_values:
        field_value = models.EntryFieldValue(
            entry_id=entry.id,
            column_id=field_data.column_id,
            value=field_data.value
        )
        db.add(field_value)
    
    db.commit()
    db.refresh(entry)
    return entry


def get_vocab_entry(db: Session, entry_id: int):
    """
    Holt einen Eintrag mit allen Feldwerten.
    """
    from sqlalchemy.orm import joinedload
    return db.query(models.VocabEntry).options(
        joinedload(models.VocabEntry.field_values).joinedload(models.EntryFieldValue.column),
        joinedload(models.VocabEntry.vocab_list)
    ).filter(models.VocabEntry.id == entry_id).first()


def get_vocab_list_entries(db: Session, list_id: int):
    """
    Holt alle Einträge einer Liste.
    """
    from sqlalchemy.orm import joinedload
    return db.query(models.VocabEntry).options(
        joinedload(models.VocabEntry.field_values).joinedload(models.EntryFieldValue.column)
    ).filter(models.VocabEntry.vocab_list_id == list_id).all()


def update_vocab_entry(db: Session, entry_id: int, data: schemas.VocabEntryUpdate):
    """
    Aktualisiert die Feldwerte eines Eintrags.
    """
    entry = get_vocab_entry(db, entry_id)
    if not entry:
        return None
    
    if data.field_values:
        # Delete old values
        db.query(models.EntryFieldValue).filter(
            models.EntryFieldValue.entry_id == entry_id
        ).delete()
        
        # Add new values
        for field_data in data.field_values:
            field_value = models.EntryFieldValue(
                entry_id=entry.id,
                column_id=field_data.column_id,
                value=field_data.value
            )
            db.add(field_value)
    
    db.commit()
    db.refresh(entry)
    return entry


def delete_vocab_entry(db: Session, entry_id: int):
    """
    Löscht einen Eintrag.
    """
    entry = get_vocab_entry(db, entry_id)
    if not entry:
        return False
    db.delete(entry)
    db.commit()
    return True


# ============== FIELD VALUES ==============
def update_field_value(db: Session, field_value_id: int, new_value: str):
    """
    Aktualisiert einen einzelnen Feldwert.
    """
    field = db.query(models.EntryFieldValue).filter(
        models.EntryFieldValue.id == field_value_id
    ).first()
    if not field:
        return None
    
    field.value = new_value
    db.commit()
    db.refresh(field)
    return field