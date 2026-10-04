from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess
import json

app = FastAPI()

class IPRequest(BaseModel):
    ip: str

@app.post("/block")
def block_ip(req: IPRequest):
    try:
        subprocess.run(f"nft add element inet filter blocked_ips {{ {req.ip} }}", shell=True, check=True)
        return {"status": "success", "action": "blocked", "ip": req.ip}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/unblock")
def unblock_ip(req: IPRequest):
    try:
        subprocess.run(f"nft delete element inet filter blocked_ips {{ {req.ip} }}", shell=True, check=True)
        return {"status": "success", "action": "unblocked", "ip": req.ip}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rules")
def get_rules():
    try:
        res = subprocess.run("nft -j list set inet filter blocked_ips", shell=True, capture_output=True, text=True)
        return {"rules": json.loads(res.stdout)}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=str(e))
