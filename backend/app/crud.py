from sqlalchemy.orm import Session
from app import models, schemas
from app.auth import hash_password

# ============== USER ==============
def create_user(db: Session, user: schemas.UserCreate):
    """
    Erstellt einen neuen User in der Datenbank.
    """
    hash_pw = hash_password(user.password)

    new_user = models.User(
        username=user.username, 
        password=hash_pw,
        role="User"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def get_users(db: Session):
    """
    Gibt alle User aus der Datenbank aus.
    """
    return db.query(models.User).all()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).all()


# ============== VOKABELLISTEN ==============
def create_vocab_list(db: Session, vocablist_data: schemas.VocabListCreate, user_id: int):
    """
    Erstellt eine neue Vokabellist für einen User.
    """
    vocab_list = models.VocabList(name=vocablist_data.name, user_id=user_id)
    db.add(vocab_list)
    db.commit()
    db.refresh(vocab_list)
    return vocab_list

def get_vocab_list(db: Session, user_id: int):
    """
    Gibt alle Vokabellisten eines bestimmten Users aus.
    """
    return db.query(models.VocabList).filter(models.VocabList.user_id == user_id).all()


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