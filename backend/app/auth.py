from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, database
import os
from dotenv import load_dotenv


# ============== Config ==============
load_dotenv()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============== Passwort ==============
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ============== JWT ==============
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        return username
    except JWTError:
        return None


# ============== User aus Token holen ==============
def get_current_user_from_token(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    username = verify_access_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Ungültiger oder abgelaufener Token")

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    return user


# ============== Admin-Check ==============
def admin_required(token: str = Depends(oauth2_scheme)):
    db = SessionLocal()
    try:
        username = verify_access_token(token)
        if not username:
            raise HTTPException(status_code=401, detail="Ungültiger oder abgelaufener Token")

        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

        if user.role != "Admin":
            raise HTTPException(status_code=403, detail="Nur Admins dürfen diese Aktion durchführen")

        return user
    finally:
        db.close()