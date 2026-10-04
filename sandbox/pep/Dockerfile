FROM python:3.11-slim
RUN apt-get update && apt-get install -y nftables iproute2 iputils-ping tcpdump curl
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
