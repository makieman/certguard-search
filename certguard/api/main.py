import os
import sys
import json
import sqlite3
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Ensure parent directory is in Python path to import orchestrator and setup_search_index
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from orchestrator import CertGuardOrchestrator
import setup_search_index

# ---------------------------------------------------------------------------
# SQLite session store
# ---------------------------------------------------------------------------
# On Railway: mount a persistent volume at /data and set RAILWAY_VOLUME_MOUNT_PATH=/data
# Locally: falls back to the repo root so nothing changes for development.
_DATA_DIR = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH", 
             os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.makedirs(_DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(_DATA_DIR, "sessions.db")

def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def _init_db():
    conn = _get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            learner     TEXT    NOT NULL,
            cert        TEXT    NOT NULL,
            verdict     TEXT    NOT NULL,
            confidence  REAL    NOT NULL,
            created_at  TEXT    NOT NULL,
            payload     TEXT    NOT NULL
        )
    """)
    conn.commit()
    conn.close()

_init_db()

app = FastAPI(
    title="CertGuard API",
    description="Backend API for the CertGuard multi-agent learning certification readiness system.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class LearnerData(BaseModel):
    name: str = Field(..., example="Alice Developer")
    skills: List[str] = Field(..., example=["python", "sql", "testing"])

class CertRequirements(BaseModel):
    certification: str = Field(..., example="Azure Data Engineer Associate")
    required_skills: List[str] = Field(..., example=["python", "sql", "azure", "databricks"])

class EvaluationRequest(BaseModel):
    learner_data: LearnerData
    cert_requirements: CertRequirements

@app.get("/")
def read_root():
    return {"message": "Welcome to CertGuard API. The multi-agent pipeline is active."}

@app.get("/health")
def health_check():
    """Liveness probe used by Render and monitoring tools."""
    return {"status": "ok", "version": "1.0.0"}

@app.post("/evaluate")
def evaluate(request: EvaluationRequest):
    try:
        orchestrator = CertGuardOrchestrator()
        result = orchestrator.evaluate_learner(
            request.learner_data.dict(),
            request.cert_requirements.dict()
        )
        # Persist session to SQLite
        verdict = result.get("judge", {}).get("decision", "unknown")
        confidence = result.get("judge", {}).get("confidence", 0.0)
        conn = _get_conn()
        conn.execute(
            "INSERT INTO sessions (learner, cert, verdict, confidence, created_at, payload) VALUES (?, ?, ?, ?, ?, ?)",
            (
                result.get("learner_name", "Unknown"),
                result.get("certification", "Unknown"),
                verdict,
                confidence,
                datetime.utcnow().isoformat(),
                json.dumps(result)
            )
        )
        conn.commit()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")

@app.get("/sessions")
def list_sessions(limit: int = 20):
    """Returns the most recent evaluation sessions."""
    try:
        conn = _get_conn()
        rows = conn.execute(
            "SELECT id, learner, cert, verdict, confidence, created_at FROM sessions ORDER BY id DESC LIMIT ?",
            (limit,)
        ).fetchall()
        conn.close()
        return {"sessions": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {str(e)}")

@app.get("/session/{session_id}")
def get_session(session_id: int):
    """Returns the full payload for a single session."""
    try:
        conn = _get_conn()
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ).fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")
        data = dict(row)
        data["payload"] = json.loads(data["payload"])
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")

@app.get("/team-insights")
def team_insights():
    """Aggregate statistics across all sessions for the Manager Dashboard."""
    try:
        conn = _get_conn()
        rows = conn.execute(
            "SELECT learner, cert, verdict, confidence, created_at FROM sessions ORDER BY id DESC"
        ).fetchall()
        conn.close()
        total = len(rows)
        ready = sum(1 for r in rows if r["verdict"].lower() in ("ready",))
        not_ready = sum(1 for r in rows if "not" in r["verdict"].lower() or r["verdict"].lower() == "not_ready")
        abstain = sum(1 for r in rows if r["verdict"].lower() in ("abstain",))
        pass_rate = round((ready / total * 100), 1) if total else 0
        recent = [dict(r) for r in rows[:10]]
        return {
            "total_analyzed": total,
            "ready": ready,
            "not_ready": not_ready,
            "abstain": abstain,
            "pass_rate": pass_rate,
            "recent_sessions": recent
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get team insights: {str(e)}")

@app.get("/docs")
def list_documents():
    """
    Lists all available certification guide documents.
    """
    try:
        documents = setup_search_index.load_documents_from_docs()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@app.post("/index")
def run_indexing():
    """
    Manually triggers indexing of docs into Azure AI Search (or local index).
    """
    try:
        azure_success = setup_search_index.setup_azure_search()
        setup_search_index.save_local_index()
        return {
            "status": "success",
            "message": "Re-indexing complete.",
            "azure_indexed": azure_success
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")
