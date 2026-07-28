FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Cloud Run injeta a variável PORT (padrão 8080) — o container tem que
# escutar nela, nunca numa porta fixa.
CMD exec gunicorn -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT app.main:app
