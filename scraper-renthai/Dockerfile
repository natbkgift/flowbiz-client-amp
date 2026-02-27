FROM python:3.11-slim

WORKDIR /app

# No external deps (stdlib-only scraper)
COPY . /app

ENV PYTHONUNBUFFERED=1

ENTRYPOINT ["python", "-u", "main.py"]
