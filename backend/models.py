import enum
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class StatusEnum(str, enum.Enum):
    TODO = "TODO"
    DOING = "DOING"
    DONE = "DONE"


class PriorityEnum(str, enum.Enum):
    HIGH = "HIGH"
    NORMAL = "NORMAL"
    LOW = "LOW"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False, default="")
    status: Mapped[StatusEnum] = mapped_column(
        Enum(StatusEnum), nullable=False, default=StatusEnum.TODO
    )
    priority: Mapped[PriorityEnum] = mapped_column(
        Enum(PriorityEnum), nullable=False, default=PriorityEnum.NORMAL
    )
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
