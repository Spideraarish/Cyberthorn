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

app.include_router(topology_router, prefix="/api")
app.include_router(stream_router, prefix="/api")
app.include_router(trust_router, prefix="/api")
app.include_router(pep_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(scenario_router, prefix="/api")
