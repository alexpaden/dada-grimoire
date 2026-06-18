FROM python:3.12-slim@sha256:d764629ce0ddd8c71fd371e9901efb324a95789d2315a47db7e4d27e78f1b0e9

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chmod=755 . .

EXPOSE 8001

CMD ["gunicorn", "worker_app:app", \
     "--bind", "0.0.0.0:8001", \
     "--workers", "2", \
     "--timeout", "30"]
