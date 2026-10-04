from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
import json
import asyncio

router = APIRouter()

active_connections = []
arduino_status = {"level": "off"}

@router.websocket("/agent-stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def broadcast_stage(stage, data):
    message = json.dumps({"stage": stage, "data": data})
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except Exception:
            pass

@router.post("/internal/agent-stream")
async def internal_stream(req: Request):
    data = await req.json()
    stage = data.get("stage")
    payload = data.get("data")
    
    if stage == "ACT":
        action = payload.get("action")
        if action in ["block", "watch"]:
            arduino_status["level"] = action
        else:
            arduino_status["level"] = "off"
            
    await broadcast_stage(stage, payload)
    return {"status": "ok"}

@router.get("/arduino-status")
def get_arduino_status():
    return arduino_status
