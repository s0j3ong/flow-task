from datetime import date, datetime
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import PriorityEnum, StatusEnum
from backend.models import Task as TaskModel

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = FastAPI(title="Task Flow API")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: PriorityEnum = PriorityEnum.NORMAL
    due_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        stripped = value.strip()
        if not (1 <= len(stripped) <= 100):
            raise ValueError("title must be 1-100 characters after trimming whitespace")
        return stripped

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        if len(value) > 2000:
            raise ValueError("description must be at most 2000 characters")
        return value


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StatusEnum] = None
    priority: Optional[PriorityEnum] = None
    due_date: Optional[date] = None

    @model_validator(mode="before")
    @classmethod
    def reject_null_for_non_nullable_fields(cls, data):
        if isinstance(data, dict):
            for field in ("title", "description", "status", "priority"):
                if field in data and data[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return data

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        stripped = value.strip()
        if not (1 <= len(stripped) <= 100):
            raise ValueError("title must be 1-100 characters after trimming whitespace")
        return stripped

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if len(value) > 2000:
            raise ValueError("description must be at most 2000 characters")
        return value


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: StatusEnum
    priority: PriorityEnum
    due_date: Optional[date] = None
    created_at: datetime


def get_task_or_404(db: Session, task_id: int) -> TaskModel:
    task = db.get(TaskModel, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.get("/api/health")
def get_health():
    return {"status": "ok"}


@app.get("/api/tasks", response_model=list[TaskOut])
def list_tasks(
    q: Optional[str] = None,
    status: Optional[StatusEnum] = None,
    priority: Optional[PriorityEnum] = None,
    db: Session = Depends(get_db),
):
    query = db.query(TaskModel)
    if q:
        query = query.filter(TaskModel.title.ilike(f"%{q.strip()}%"))
    if status is not None:
        query = query.filter(TaskModel.status == status)
    if priority is not None:
        query = query.filter(TaskModel.priority == priority)
    return query.order_by(TaskModel.id).all()


@app.post("/api/tasks", response_model=TaskOut, status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    task = TaskModel(
        title=payload.title,
        description=payload.description,
        status=StatusEnum.TODO,
        priority=payload.priority,
        due_date=payload.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.patch("/api/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = get_task_or_404(db, task_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = get_task_or_404(db, task_id)
    db.delete(task)
    db.commit()


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
