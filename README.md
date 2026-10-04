# Cyberthorn - Zero-Trust Operations Center

Cyberthorn is a modern, AI-driven Zero-Trust Security Operations Center (SOC). It provides real-time network anomaly detection using Graph Neural Networks (GNN), autonomous response via an OODA (Observe, Orient, Decide, Act) loop, and dynamic firewall isolation using Docker's `nftables` via Policy Enforcement Points (PEP).

The entire dashboard and agent pipeline are completely dynamic—detecting topology and executing responses against real containerized network traffic without any hardcoded logic.

---

## 🏗️ Architecture

1. **Docker Sandbox (`sandbox/`)**: The virtual network topology consisting of `attacker`, `pep` (Policy Enforcement Point router), `management`, and `victim` networks.
2. **Endpoint IDS (`agent/network_ids.py`)**: A lightweight real-time Python packet sniffer deployed to endpoint nodes (similar to a Wazuh HIDS agent) that monitors TCP socket traffic for floods and port scans using raw `tcpdump`.
3. **Agent Loop (`agent/loop.py`)**: The autonomous brain of the system. It runs continuously, pulling alerts, scoring them via GNN, and deciding whether to isolate nodes or watch them.
4. **Backend API (`dashboard/backend/`)**: A FastAPI service that bridges the Docker environment, Topology APIs, and WebSocket streams.
5. **Frontend UI (`dashboard/frontend/`)**: A gorgeous, real-time React/Vite dashboard visualizing the topology, isolating threats, and monitoring telemetry.

---

## 🚀 Quick Start Guide

You need 4 terminal windows to run the complete Cyberthorn pipeline.

### Step 1: Start the Virtual Docker Sandbox
This spins up the vulnerable network topology.
```bash
cd sandbox
docker-compose up --build -d
```
*Note: Make sure your Docker daemon is running!*

### Step 2: Start the Backend API
The backend orchestrates the topology mapping and scenario execution.
```bash
cd dashboard/backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --port 8001
```

### Step 3: Start the Autonomous Agent & IDS Pipeline
This starts the GNN reasoning loop and the Endpoint Packet Sniffer.
```bash
cd agent
python3 -m pip install -r requirements.txt

# In terminal 3, run the Endpoint IDS:
python3 network_ids.py

# In terminal 4, run the Agent Loop:
python3 loop.py
```

### Step 4: Start the Frontend UI
Launch the beautiful React SOC Dashboard.
```bash
cd dashboard/frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ⚔️ Executing Real Scenarios
1. Go to the dashboard in your browser.
2. Under "Attack Scenarios", click **Port Scan**.
3. The backend will dynamically identify the attacker IP, drop into the attacker container, and execute a live `nmap` attack against the victim.
4. The **Endpoint IDS** will intercept the real packets, feed them to the **Agent Loop**.
5. The GNN will score the threat, and the Agent will command the **PEP Router** to update its `nftables` to isolate the attacker.
6. The dashboard will instantly update to show the red isolation badge on the topology graph.

Everything happening in the dashboard is reacting to 100% real network traffic generated inside the Docker Sandbox. No mock data is used!
