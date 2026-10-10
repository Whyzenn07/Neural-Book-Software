# ── Stage 1: Build Frontend (Node.js) ──────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Backend & Static Serving (Python) ───────
FROM python:3.11-slim
WORKDIR /app

# Install basic system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy Backend source code
COPY backend/ ./backend/

# Copy built frontend from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set permissions for non-root user (Standard for Hugging Face Spaces & security)
RUN useradd -m -u 1000 user && \
    mkdir -p /app/backend/uploads && \
    chown -R user:user /app
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PORT=7860

WORKDIR /app/backend

# Support both Hugging Face Spaces port (7860) and dynamic cloud port ($PORT)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
