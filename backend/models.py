from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    details: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, sa_column_kwargs={"type_": SQLITE_JSON}
    )
    # Null session_id => "current" (not archived); non-null => belongs to a saved session
    session_id: Optional[int] = Field(
        default=None, foreign_key="session.id", index=True
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Session(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="Saved Session")
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
