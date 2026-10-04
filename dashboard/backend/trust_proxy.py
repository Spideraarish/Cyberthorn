from fastapi import APIRouter
import sqlite3
import os

router = APIRouter()
DB_PATH = os.path.join(os.path.dirname(__file__), '../../agent/trust.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/trust-scores")
def get_scores():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM trust_scores")
        scores = cursor.fetchall()
        
        cursor.execute("SELECT * FROM actions ORDER BY timestamp DESC LIMIT 50")
        actions = cursor.fetchall()
        conn.close()
        return {
            "scores": [dict(row) for row in scores],
            "actions": [dict(row) for row in actions]
        }
    except sqlite3.OperationalError:
        return {"scores": [], "actions": []}
