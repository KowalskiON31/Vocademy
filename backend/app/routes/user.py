from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import schemas, crud, database

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============== User ==============
# Post new
@router.post("/register/", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)

# Get All
@router.get("/user/", response_model=list[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return crud.get_users(db)

# Get ById
@router.post("/user/{user_id}", response_model=list[schemas.User])
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user(db, user_id)