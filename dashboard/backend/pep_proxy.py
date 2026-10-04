from fastapi import APIRouter, Request
import requests

router = APIRouter()
PEP_URL = "http://localhost:8000"

@router.get("/rules")
def get_rules():
    try:
        res = requests.get(f"{PEP_URL}/rules")
        return res.json()
    except Exception:
        return {"rules": {}}

@router.post("/unblock")
async def unblock(req: Request):
    data = await req.json()
    ip = data.get("ip")
    try:
        res = requests.post(f"{PEP_URL}/unblock", json={"ip": ip})
        return res.json()
    except Exception:
        return {"status": "error"}
