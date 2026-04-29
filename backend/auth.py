from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

from backend.models import User, SessionLocal

import os

SECRET_KEY = os.getenv("SECRET_KEY", "dkJ29kS98sKf3iXn5q1WzMf29vNslqXo87FsA1CzZLpX")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# router = APIRouter()
router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# ... (Previous Pydantic models and helper functions remain unchanged)

class UserIn(BaseModel):
    username: str
    password: str

class UserSignUp(BaseModel):
    username: str
    password: str
    first_name: str = None
    last_name: str = None
    organization: str = None

class UserInfo(BaseModel):
    username: str
    first_name: str = None
    last_name: str = None
    organization: str = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserInfo = None



def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


# === SIGNUP ENDPOINT ===
@router.post("/signup")
def signup(user: UserSignUp, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pw = get_password_hash(user.password)
    db_user = User(
        username=user.username, 
        password=hashed_pw,
        first_name=user.first_name,
        last_name=user.last_name,
        organization=user.organization
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Auto-login: generate token
    token = create_access_token({"sub": db_user.username})
    
    user_info = UserInfo(
        username=db_user.username,
        first_name=db_user.first_name,
        last_name=db_user.last_name,
        organization=db_user.organization
    )
    
    return {"access_token": token, "token_type": "bearer", "user": user_info }

# === Reject GET requests to /signup ===
@router.get("/signup")
def reject_get_signup(request: Request):
    raise HTTPException(status_code=405, detail="Method Not Allowed")


# === LOGIN ENDPOINT ===
@router.post("/login", response_model=Token)
def login(user: UserIn, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    user_info = UserInfo(
        username=db_user.username,
        first_name=db_user.first_name,
        last_name=db_user.last_name,
        organization=db_user.organization
    )
    return {"access_token": token, "token_type": "bearer", "user": user_info}

@router.get("/me", response_model=UserInfo)
def get_me(user: User = Depends(get_current_user)):
    return UserInfo(
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        organization=user.organization
    )

# === Reject GET requests to /login ===
@router.get("/login")
def reject_get_login(request: Request):
    raise HTTPException(status_code=405, detail="Method Not Allowed")
