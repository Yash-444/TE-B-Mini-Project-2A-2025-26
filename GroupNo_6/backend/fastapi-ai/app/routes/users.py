from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

# Comment out the following if you do NOT want DB-backed endpoints for now:
# from sqlalchemy.orm import Session
# from app.database import get_db
# from app.models import User, UserOutfit

router = APIRouter()

# Demo/static profile endpoint for /api/user/me
@router.get("/user/me")
def get_profile():
    return {
        "firstname": "Maaz",
        
        "lastname": "User",
        "email": "demo@email.com"
    }

# ---- Uncomment the following and fix models if you have User & UserOutfit defined! ----

# class UserUpdate(BaseModel):
#     first_name: str = None
#     last_name: str = None
#     profile_picture: str = None
#     gender: str = None

# @router.get("/profile")
# def get_profile(user_id: str, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return {
#         "id": str(user.id),
#         "firstname": user.first_name,
#         "lastname": user.last_name,
#         "email": user.email,
#         "avatar": user.profile_picture,
#         "gender": user.gender
#     }

# @router.put("/profile")
# def update_profile(user_id: str, data: UserUpdate, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     if data.first_name:
#         user.first_name = data.first_name
#     if data.last_name:
#         user.last_name = data.last_name
#     if data.profile_picture:
#         user.profile_picture = data.profile_picture
#     if data.gender:
#         user.gender = data.gender
    
#     db.commit()
#     db.refresh(user)
    
#     return {"message": "Profile updated", "user": {
#         "id": str(user.id),
#         "firstname": user.first_name,
#         "lastname": user.last_name,
#         "email": user.email,
#         "avatar": user.profile_picture
#     }}

# # ...rest of your endpoints (saved-items, like-outfit, style-history) ...

