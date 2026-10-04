import requests

class PEPClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url

    def block(self, ip):
        res = requests.post(f"{self.base_url}/block", json={"ip": ip})
        res.raise_for_status()
        return res.json()

    def unblock(self, ip):
        res = requests.post(f"{self.base_url}/unblock", json={"ip": ip})
        res.raise_for_status()
        return res.json()

    def get_rules(self):
        res = requests.get(f"{self.base_url}/rules")
        res.raise_for_status()
        return res.json()
