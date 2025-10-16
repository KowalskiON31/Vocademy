from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import schemas, crud, database, models
from app.auth import (
    verify_password, create_access_token,
    get_current_user_from_token, admin_required
)

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============== Register & Login ==============
@router.post("/register/", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)


@router.post("/login/")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Ungültiger Benutzername oder Passwort")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Benutzerkonto ist deaktiviert")

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# ============== User Management ==============
@router.get("/me/", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user_from_token)):
    return current_user


@router.get("/user/", response_model=list[schemas.User])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(admin_required)):
    """Nur Admins dürfen alle Benutzer sehen."""
    return crud.get_users(db)


@router.get("/user/{user_id}", response_model=schemas.User)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user_from_token)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    return user


@router.put("/user/{user_id}", response_model=schemas.User)
def update_user_route(
    user_id: int,
    updated_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_token)
):
    return crud.update_user(db, user_id, updated_data, current_user)


# ============== Admin Only ==============
@router.put("/user/{user_id}/{action}", response_model=schemas.User)
def toggle_user_activation(
    user_id: int,
    action: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required)
):
    if action not in ["activate", "deactivate"]:
        raise HTTPException(status_code=400, detail="Ungültige Aktion")

    updated_data = schemas.UserUpdate(is_active=(action == "activate"))
    return crud.update_user(db, user_id, updated_data, current_user)


@router.delete("/user/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required)
):
    return crud.delete_user(db, user_id, current_user)