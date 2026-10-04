#!/bin/bash
ip route add 10.0.0.0/16 via 10.0.1.254
exec tail -f /dev/null
