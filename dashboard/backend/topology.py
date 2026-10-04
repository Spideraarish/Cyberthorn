from fastapi import APIRouter
import subprocess
import json

router = APIRouter()

@router.get("/topology")
def get_topology():
    try:
        res = subprocess.run(
            ["docker", "network", "inspect", "sandbox_untrusted", "sandbox_enforcement", "sandbox_management", "sandbox_protected-critical", "sandbox_protected-user"],
            capture_output=True, text=True
        )
        if res.returncode != 0:
            return {"nodes": [], "edges": []}
            
        networks = json.loads(res.stdout)
        nodes = {}
        for net in networks:
            net_name = net['Name'].replace('sandbox_', '')
            for container_id, container in net['Containers'].items():
                name = container['Name']
                ip = container['IPv4Address'].split('/')[0]
                if name not in nodes:
                    nodes[name] = {"id": name, "label": name, "zones": [], "ips": []}
                if net_name not in nodes[name]["zones"]:
                    nodes[name]["zones"].append(net_name)
                nodes[name]["ips"].append(ip)
        
        return {"nodes": list(nodes.values()), "edges": []}
    except Exception as e:
        return {"nodes": [], "edges": []}
