#!/bin/bash
while true; do
  docker exec victim-user curl -s http://10.0.4.10 > /dev/null
  docker exec victim-critical curl -s http://10.0.5.10 > /dev/null
  sleep 5
done
