# Auto Review Hub — Django application image (multi-stage).
#
# Stage 1 builds the React frontend. This matters for hosted deploys
# (Render etc.): the frontend build output is gitignored, so an image
# built straight from the repo would have no app for Django to serve.
# Stage 2 is the Django/gunicorn runtime, with the built frontend copied
# into frontend/build, where djangoproj settings and URLs expect it.
# Static files are collected by entrypoint.sh at container start.

FROM node:18-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN CI=false npm run build

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/
COPY --from=frontend-build /build/build /app/frontend/build

RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "djangoproj.wsgi:application"]
