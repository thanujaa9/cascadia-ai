FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, runbooks, and compiled frontend assets
COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/

# Expose port (default 8000 or Render's PORT)
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "python -m uvicorn --app-dir backend main:app --host 0.0.0.0 --port ${PORT:-8000}"]
