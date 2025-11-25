from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import database as db

app = FastAPI(title="My Shift API", version="1.0.0")

# CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://kalikrit.pythonanywhere.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели Pydantic
class ShiftBase(BaseModel):
    date: str
    start_time: str
    end_time: str
    employee: str
    role: str

class ShiftCreate(ShiftBase):
    pass

class Shift(ShiftBase):
    id: int

class ShiftUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    employee: Optional[str] = None
    role: Optional[str] = None

# Базовые endpoints для тестирования
@app.get("/")
async def root():
    return {"message": "My Shift API is running!"}

@app.get("/shifts", response_model=List[Shift])
async def get_all_shifts():
    """Получить все смены"""
    return db.get_shifts()

@app.get("/shifts/{date}", response_model=List[Shift])
async def get_shifts_by_date(date: str):
    """Получить смены за конкретную дату"""
    shifts = db.get_shifts()
    return [shift for shift in shifts if shift["date"] == date]

@app.post("/shifts", response_model=Shift)
async def create_shift(shift: ShiftCreate):
    """Создать новую смену"""
    shifts = db.get_shifts()

    # Генерируем ID
    new_id = max([s["id"] for s in shifts], default=0) + 1

    new_shift = {
        "id": new_id,
        **shift.dict()
    }

    shifts.append(new_shift)
    db.save_shifts(shifts)

    return new_shift

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)