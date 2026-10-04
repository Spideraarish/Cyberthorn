#!/bin/bash
ip route add 10.0.0.0/16 via 10.0.4.254
exec python -m http.server 80
