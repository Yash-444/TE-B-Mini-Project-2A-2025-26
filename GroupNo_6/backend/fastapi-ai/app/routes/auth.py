from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


router = APIRouter()

users = {}  # simple in-memory user store

class RegisterRequest(BaseModel):
    firstname: str
    lastname: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(req: RegisterRequest):
    if req.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    users[req.email] = {
        "firstname": req.firstname,
        "lastname": req.lastname,
        "email": req.email,
        "password": req.password,
    }
    return {
        "token": "fake-token",
        "user": {k: v for k, v in users[req.email].items() if k != "password"}
    }

@router.post("/login")
def login(req: LoginRequest):
    user = users.get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "token": "fake-token",
        "user": {k: v for k, v in user.items() if k != "password"}
    }
