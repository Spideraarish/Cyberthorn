FROM python:3.11-slim
RUN apt-get update && apt-get install -y iproute2 iputils-ping curl nmap
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
