from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session as DBSession, select
from datetime import datetime
from typing import List, Optional, Dict, Any

from database import init_db, get_session
from models import Task, Session as TaskSession

app = FastAPI(title="Tasks & Sessions API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# ---------- TASKS ----------
@app.post("/tasks", response_model=Task)
def create_task(body: Dict[str, Any], db: DBSession = Depends(get_session)):
    t = Task(
        title=body.get("title", "Untitled Task"),
        details=body.get("details"),
        metadata=body.get("metadata"),
        session_id=None,  # current by default
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@app.get("/tasks", response_model=List[Task])
def list_current_tasks(db: DBSession = Depends(get_session)):
    # Current tasks only (session_id IS NULL), newest → oldest
    stmt = (
        select(Task).where(Task.session_id.is_(None)).order_by(Task.created_at.desc())
    )
    return db.exec(stmt).all()


@app.put("/tasks/{task_id}", response_model=Task)
def update_task(
    task_id: int, body: Dict[str, Any], db: DBSession = Depends(get_session)
):
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    t.title = body.get("title", t.title)
    t.details = body.get("details", t.details)
    t.metadata = body.get("metadata", t.metadata)
    t.updated_at = datetime.utcnow()
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: DBSession = Depends(get_session)):
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    db.delete(t)
    db.commit()
    return {"ok": True}


# ---------- SESSIONS ----------
@app.post("/sessions", response_model=TaskSession)
def create_session(body: Dict[str, Any], db: DBSession = Depends(get_session)):
    # Create an empty session; tasks can be attached in a separate step
    s = TaskSession(name=body.get("name", "Saved Session"), note=body.get("note"))
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@app.post("/sessions/archive", response_model=TaskSession)
def archive_current_tasks(
    body: Dict[str, Any] = {}, db: DBSession = Depends(get_session)
):
    """
    Creates a new session and moves all current tasks (session_id NULL) into it.
    Optional body: { "name": "Session Name", "note": "Optional note" }
    """
    s = TaskSession(
        name=body.get(
            "name", "Session " + datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        ),
        note=body.get("note"),
    )
    db.add(s)
    db.commit()
    db.refresh(s)

    tasks = db.exec(select(Task).where(Task.session_id.is_(None))).all()
    for t in tasks:
        t.session_id = s.id
        t.updated_at = datetime.utcnow()
        db.add(t)
    db.commit()
    return s


@app.get("/sessions", response_model=List[TaskSession])
def list_sessions(db: DBSession = Depends(get_session)):
    # Previous sessions (any), newest → oldest
    stmt = select(TaskSession).order_by(TaskSession.created_at.desc())
    return db.exec(stmt).all()


@app.get("/sessions/{sid}/tasks", response_model=List[Task])
def list_session_tasks(sid: int, db: DBSession = Depends(get_session)):
    if not db.get(TaskSession, sid):
        raise HTTPException(404, "Session not found")
    stmt = select(Task).where(Task.session_id == sid).order_by(Task.created_at.desc())
    return db.exec(stmt).all()
