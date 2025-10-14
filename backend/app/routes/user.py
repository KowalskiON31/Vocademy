from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app import schemas, crud, database, models
from app.auth import verify_password, create_access_token, verify_access_token

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

# Login
@router.post("/login/")
def login(from_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == from_data.username).first()
    
    if not user or not verify_password(from_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungülter Benutzername oder Passwort"
        )
        
    acces_token = create_access_token(data={"sub": user.username})
    return {"access_token": acces_token, "token_type": "bearer"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")

@router.get("/me/")
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Ungültiger oder abgelaufender Token")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    return user

@router.get("/me/info")
def get_my_info(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }

    
# Get All
@router.get("/user/", response_model=list[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return crud.get_users(db)

# Get ById
@router.get("/user/{user_id}", response_model=list[schemas.User])
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user(db, user_id)