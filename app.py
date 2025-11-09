# app.py

from __future__ import annotations  # MUST be the first non-comment line

# --- Import shim so we can import from backend/ even when app.py is at project root ---
import os, sys

ROOT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Try package-style first; fall back to shimmed path
try:
    from backend.utils.llm_client import LLMClient
    from backend.prompts.templates import SIMULATE_SYSTEM_PROMPT
except ModuleNotFoundError:
    from utils.llm_client import LLMClient
    from prompts.templates import SIMULATE_SYSTEM_PROMPT

from typing import Optional, List, Dict, Any, Tuple
import traceback
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import FastAPI, Request, HTTPException, Depends, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx

# --- SQLModel / SQLite ---
from sqlmodel import (
    SQLModel,
    Field as SQLField,
    Session as DBSession,
    select,
)
from sqlalchemy import Column
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON
from sqlmodel import create_engine


# ============================================================================
# FastAPI app + CORS
# ============================================================================
app = FastAPI(title="AI Scenario Planner API")
llm = LLMClient()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# ============================================================================
# Debug middleware (logs full trace as JSON)
# ============================================================================
@app.middleware("http")
async def debug_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            {"error": str(e), "path": request.url.path}, status_code=500
        )


# ============================================================================
# Simple metrics
# ============================================================================
CALLS = {"count": 0}


@app.get("/metrics")
def metrics():
    return {"api_calls": CALLS["count"]}


# ============================================================================
# Models for /simulate (kept)
# ============================================================================
class SimulateReq(BaseModel):
    scenario: str
    context: Optional[Dict[str, Any]] = None


# ============================================================================
# Health + Config (kept)
# ============================================================================
@app.get("/health")
def health():
    return {
        "status": "ok",
        "llm_provider": llm.provider or "mock",
        "llm_model": llm.model,
        "llm_mock_mode": llm.mock,
    }


USE_MOCK_ON_FAIL = os.getenv("USE_MOCK_ON_FAIL", "1") == "1"


@app.get("/config")
def config():
    return {
        "provider": os.getenv("PROVIDER"),
        "api_base": os.getenv("API_BASE"),
        "model": os.getenv("MODEL"),
        "has_api_key": bool(os.getenv("API_KEY")),
        "cwd": os.getcwd(),
    }


# ============================================================================
# /simulate (kept behavior)
# ============================================================================
@app.post("/simulate")
async def simulate(body: SimulateReq):
    CALLS["count"] += 1
    print(f"\n{'=' * 60}")
    print(f"📥 Received scenario request #{CALLS['count']}")
    print(f"Scenario: {body.scenario[:100]}...")
    payload = {"scenario": body.scenario, "context": body.context or {}}
    print(f"🔧 LLM Config: provider={llm.provider}, model={llm.model}, mock={llm.mock}")

    try:
        print("🤖 Calling LLM (Groq)...")
        result = await llm.generate_json(SIMULATE_SYSTEM_PROMPT, payload)
        if not isinstance(result, dict):
            raise ValueError("LLM returned non-JSON content")

        print(f"✅ LLM returned analysis with {len(result)} fields")
        print(f"   Scores: {result.get('scores', {})}")
        print(f"   Decision: {result.get('recommendation', {}).get('decision', 'N/A')}")
        print(f"{'=' * 60}\n")
        return result

    except httpx.HTTPStatusError as e:
        print(f"❌ Groq API Error: {e.response.status_code}")
        print(f"   Response: {e.response.text[:200]}")
        raise HTTPException(status_code=502, detail=e.response.text)

    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        traceback.print_exc()

        if USE_MOCK_ON_FAIL:
            print("⚠️  Falling back to mock data...")
            try:
                mock_result = await LLMClient().generate_json("", payload)
                print("✅ Mock data generated")
                return mock_result
            except Exception as mock_err:
                print(f"❌ Mock fallback also failed: {mock_err}")

        print(f"{'=' * 60}\n")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
#                           SQLite Task Storage
# ============================================================================
class Task(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)

    # core scenario fields
    name: str
    description: str
    target_market: str
    timeline: str
    resources: Optional[str] = None

    # JSON on SQLite (use typing.List/Dict and explicit JSON columns)
    assumptions: Optional[List[str]] = SQLField(
        default=None,
        sa_column=Column(SQLITE_JSON),
    )
    ai_analysis: Optional[Dict[str, Any]] = SQLField(
        default=None,
        sa_column=Column(SQLITE_JSON),
    )

    # stored in UTC
    created_at: datetime = SQLField(default_factory=lambda: datetime.now(timezone.utc))


# Accept camelCase from the frontend via aliases
class TaskCreate(BaseModel):
    name: str
    description: str
    target_market: str = Field(alias="targetMarket")
    timeline: str
    resources: Optional[str] = None
    assumptions: Optional[List[str]] = None
    ai_analysis: Optional[Dict[str, Any]] = Field(default=None, alias="aiAnalysis")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    class Config:
        populate_by_name = True  # allow snake_case too
        extra = "ignore"  # ignore unknown keys


class TaskRead(BaseModel):
    id: int
    name: str
    description: str
    target_market: str
    timeline: str
    resources: Optional[str]
    assumptions: Optional[List[str]]
    ai_analysis: Optional[Dict[str, Any]]
    created_at: datetime


# DB in project root next to app.py
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./prosolve.db")
engine = create_engine(DB_URL, echo=False)


def get_session():
    with DBSession(engine) as session:
        yield session


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    print("✅ SQLite ready at", DB_URL)


# --- Helpers (today bounds + local date) ---
CENTRAL_TZ = ZoneInfo("America/Chicago")


def today_bounds_chicago() -> Tuple[datetime, datetime]:
    """
    Return [start_of_today, start_of_tomorrow) in America/Chicago, both as UTC datetimes.
    """
    now_cst = datetime.now(CENTRAL_TZ)
    start_local = datetime(
        year=now_cst.year, month=now_cst.month, day=now_cst.day, tzinfo=CENTRAL_TZ
    )
    end_local = start_local + timedelta(days=1)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def to_local_date_str(dt_utc: datetime) -> str:
    """YYYY-MM-DD label in America/Chicago."""
    return dt_utc.astimezone(CENTRAL_TZ).date().isoformat()


# --- Endpoints ---
@app.post("/tasks", response_model=TaskRead)
def add_task(payload: TaskCreate, session: DBSession = Depends(get_session)):
    task = Task(
        name=payload.name,
        description=payload.description,
        target_market=payload.target_market,
        timeline=payload.timeline,
        resources=payload.resources,
        assumptions=payload.assumptions,
        ai_analysis=payload.ai_analysis,
        created_at=payload.created_at or datetime.now(timezone.utc),
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@app.get("/tasks", response_model=List[TaskRead])
def list_tasks(session: DBSession = Depends(get_session)):
    q = select(Task).order_by(Task.created_at.desc())
    return list(session.exec(q))


# Alias for legacy frontend calls
@app.get("/scenarios", response_model=List[TaskRead])
def list_scenarios_alias(session: DBSession = Depends(get_session)):
    q = select(Task).order_by(Task.created_at.desc())
    return list(session.exec(q))


@app.get("/tasks/today", response_model=List[TaskRead])
def tasks_today(session: DBSession = Depends(get_session)):
    start_utc, end_utc = today_bounds_chicago()
    q = (
        select(Task)
        .where(Task.created_at >= start_utc)
        .where(Task.created_at < end_utc)
        .order_by(Task.created_at.desc())
    )
    return list(session.exec(q))


@app.get("/tasks/history")
def tasks_history_grouped(session: DBSession = Depends(get_session)):
    """
    Group tasks by local (America/Chicago) date, excluding today's.
    Returns: {"groups": {"YYYY-MM-DD": [TaskRead,...], ...}}
    """
    start_utc, end_utc = today_bounds_chicago()
    q = (
        select(Task)
        .where(
            (Task.created_at < start_utc) | (Task.created_at >= end_utc)
        )  # not today
        .order_by(Task.created_at.desc())
    )
    rows = list(session.exec(q))

    grouped: Dict[str, List[TaskRead]] = {}
    for t in rows:
        key = to_local_date_str(t.created_at)
        grouped.setdefault(key, []).append(
            TaskRead(
                id=t.id,
                name=t.name,
                description=t.description,
                target_market=t.target_market,
                timeline=t.timeline,
                resources=t.resources,
                assumptions=t.assumptions,
                ai_analysis=t.ai_analysis,
                created_at=t.created_at,
            )
        )
    return {"groups": grouped}


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: DBSession = Depends(get_session)):
    obj = session.get(Task, task_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(obj)
    session.commit()
    return {"ok": True, "deleted_id": task_id}


# ============================================================================
#              Sessions aliases (match your frontend calls)
# ============================================================================


@app.get("/sessions")
def sessions_alias(session: DBSession = Depends(get_session)):
    """
    Return the same structure as /tasks/history.
    """
    return tasks_history_grouped(session)


@app.post("/sessions/archive")
def sessions_archive_noop():
    """
    No-op archive endpoint so the UI flow doesn't break.
    You can extend this to actually snapshot tasks if desired.
    """
    return {"ok": True}


@app.get("/sessions/{session_id}/tasks", response_model=List[TaskRead])
def sessions_by_date_tasks(
    session_id: str = Path(
        ..., description="Local date in YYYY-MM-DD (America/Chicago)"
    ),
    session: DBSession = Depends(get_session),
):
    """
    Treat session_id as a local date (YYYY-MM-DD in America/Chicago) and
    return all tasks created on that local date.
    """
    try:
        target_date = datetime.strptime(session_id, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="session_id must be YYYY-MM-DD")

    # compute the local start/end for that date, convert to UTC for query
    start_local = datetime(
        target_date.year, target_date.month, target_date.day, tzinfo=CENTRAL_TZ
    )
    end_local = start_local + timedelta(days=1)
    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)

    q = (
        select(Task)
        .where(Task.created_at >= start_utc)
        .where(Task.created_at < end_utc)
        .order_by(Task.created_at.desc())
    )
    return list(session.exec(q))
