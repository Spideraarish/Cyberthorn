from fastapi import APIRouter
import random
import time

router = APIRouter()

@router.get("/alerts")
def get_alerts():
    # Return placeholder as Wazuh API requires auth and minutes to boot up in Docker
    return {"alerts": []}
