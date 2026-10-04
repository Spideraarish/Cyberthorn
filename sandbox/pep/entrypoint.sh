#!/bin/bash
nft add table inet filter
nft add chain inet filter forward { type filter hook forward priority 0 \; policy accept \; }
nft add set inet filter blocked_ips { type ipv4_addr \; }
nft add rule inet filter forward ip saddr @blocked_ips drop
exec uvicorn app:app --host 0.0.0.0 --port 8000
