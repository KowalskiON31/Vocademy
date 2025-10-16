from sqlalchemy.orm import Session
from app import models, schemas, auth
from fastapi import HTTPException, status
from app.auth import hash_password

# ============== USER ==============
def create_user(db: Session, user: schemas.UserCreate):
    hashed_pw = hash_password(user.password)

    new_user = models.User(
        username=user.username.strip(),
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

# ============== VOKABELLISTEN ==============
def create_vocab_list(db: Session, vocablist_data: schemas.VocabListCreate, user_id: int):
    """
    Erstellt eine neue Vokabellist für einen User.
    """
    new_vocab_list = models.VocabList(name=vocablist_data.name, user_id=user_id)
    db.add(new_vocab_list)
    db.commit()
    db.refresh(new_vocab_list)
    return new_vocab_list

def get_vocab_list_by_user(db: Session, user_id: int):
    """
    Gibt alle Vokabellisten eines bestimmten Users aus.
    """
    return db.query(models.VocabList).filter(models.VocabList.user_id == user_id).all()

def get_vocab_list(db: Session, vocablist_id: int):
    """
    Gibt Vokabellist einer bestimmten ID aus.
    """
    return db.query(models.VocabList).filter(models.VocabList.id == vocablist_id).first()


def get_all_vocabt_items(db: Session):
    return db.query(models.VocabItem).all()

# ============== VOKABELN ==============
def create_vocab_item(db: Session, item: schemas.VocabItemCreate):
    """
    Erstellt eine neue Vokabel in einer bestimmten Liste.
    """
    vocab = models.VocabItem(
        word=item.word,
        translation=item.translation,
        vocab_list_id=item.vocab_list_id
    )
    db.add(vocab)
    db.commit()
    db.refresh(vocab)
    return vocab

def get_all_vocab_items(db: Session):
    """
    Gibt alle Vokabeln in der Datenbank aus.
    """
    return db.query(models.VocabItem).all()