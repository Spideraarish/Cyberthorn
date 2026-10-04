FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y nmap hping3 curl iproute2 iputils-ping
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
