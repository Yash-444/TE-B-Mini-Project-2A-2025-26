from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class QuizSubmission(BaseModel):
    userId: str
    answers: dict

# You can save these submissions in memory, database, etc.
quiz_submissions = []

@router.post("/submit")
def submit_quiz(submission: QuizSubmission):
    quiz_submissions.append(submission.dict())
    return {"message": "Quiz submitted successfully!"}

@router.get("/history")
def get_quiz_history():
    return quiz_submissions
