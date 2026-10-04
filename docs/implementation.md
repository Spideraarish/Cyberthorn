# Cyberthorn Phase 5: Zero-Trust Implementation Guide

This document explains exactly how the Zero-Trust Agentic Architecture operates. No mock arrays or hardcoded delays are used. It relies on a live feedback loop connecting a Docker sandbox, an Agentic AI Daemon, and a React Dashboard.

## Architecture Components

1. **Docker Sandbox (`sandbox/`)**
   - We simulate a micro-network containing:
     - `attacker`: A rogue node capable of running `nmap` and `curl`.
     - `victim-user` & `victim-critical`: Internal microservices.
     - `pep` (Policy Enforcement Point): A central router running `nftables`. All traffic between nodes flows through `pep`.
   - **Zero Trust Principle**: No node trusts another. Access is dynamically revoked by the `pep` firewall.

2. **The Agentic Loop Daemon (`agent/loop.py`)**
   - Runs in the background 24/7.
   - Constantly polls `alerts.db` for new telemetry.
   - When an alert arrives, the agent processes it through the OODA loop:
     - **OBSERVE**: Read the alert (IP, Zone, Wazuh Event).
     - **ORIENT**: Query the GNN model for a live anomaly score for that IP.
     - **DECIDE**: Uses a Zero-Trust Rules Engine to evaluate the risk (Critical zones + high anomalies = BLOCK).
     - **ACT**: Reaches out to the `pep` FastAPI and injects an `nftables` drop rule.
     - **REFLECT**: Updates the local `trust.db` and broadcasts the entire reasoning to the Dashboard.

3. **Wazuh & Telemetry (`sandbox/backend/scenario_trigger.py`)**
   - A full Wazuh installation requires ~8GB of RAM. For this implementation, we simulate Wazuh's alert delivery mechanism by pushing telemetry directly into the `alerts.db` SQLite queue when an attack occurs.

4. **Premium Glassmorphism Dashboard (`dashboard/frontend`)**
   - The React UI listens to a live WebSocket (`ws://localhost:8001/ws/agent-stream`).
   - `LiveLog` component traces the exact chronological steps of an attack.
   - Built using Framer Motion to provide high-end, smooth animations and transitions.

## How to Test
1. Open the dashboard at `http://localhost:5173`.
2. Look at the **Topology Graph**. You will see the network connecting to the central `pep`.
3. In the **Live Demo Scenarios** panel, click **Port Scan**.
4. Observe the **Architecture Activity Log** to watch the alert arrive, the Agent's OODA loop analyze it, the decision to block, and finally, the Toplogy Graph severing the connection (turning red).
