import sqlite3
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os

from topology import router as topology_router
from agent_stream import router as stream_router
from trust_proxy import router as trust_router
from pep_proxy import router as pep_router
from alerts_proxy import router as alerts_router
from scenario_trigger import router as scenario_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import requests

app.include_router(topology_router, prefix="/api")
app.include_router(stream_router, prefix="/api")
app.include_router(trust_router, prefix="/api")
app.include_router(pep_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(scenario_router, prefix="/api")

@app.post("/api/reset")
async def reset_soc():
    errors = []
    # 1. Clear databases
    for db in ['../../agent/trust.db', '../../agent/alerts.db']:
        db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), db))
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path, timeout=5)
                if 'trust.db' in db:
                    conn.execute("DELETE FROM trust_scores")
                    conn.execute("DELETE FROM actions")
                else:
                    conn.execute("DELETE FROM incoming_alerts")
                conn.commit()
            except Exception as e:
                errors.append(f"DB Error ({db}): {str(e)}")
            finally:
                try:
                    conn.close()
                except:
                    pass

    # 2. Unblock all IPs in PEP
    try:
        rules = requests.get("http://localhost:8000/rules", timeout=2).json().get("rules", {})
        for item in rules.get("nftables", []):
            if "set" in item and item["set"].get("name") == "blocked_ips":
                ips = item["set"].get("elem", [])
                if isinstance(ips, list):
                    for ip in ips:
                        try:
                            requests.post("http://localhost:8000/unblock", json={"ip": ip}, timeout=2)
                        except Exception as e:
                            errors.append(f"Unblock Error ({ip}): {str(e)}")
    except Exception as e:
        errors.append(f"Rules Fetch Error: {str(e)}")

    if errors:
        return {"status": "error", "message": "SOC Reset with errors", "errors": errors}
    return {"status": "success", "message": "SOC Reset"}
