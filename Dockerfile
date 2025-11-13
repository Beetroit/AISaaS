# Stage 1: Builder
FROM python:3.13 AS builder

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV UV_NO_CACHE=true

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python -m venv /opt/venv
# Activate venv and install uv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install Python dependencies into the virtual environment
RUN uv pip install --no-cache -r pyproject.toml

# Copy backend application code
COPY backend /app/backend
COPY alembic.ini alembic.ini
COPY migrations migrations

# Stage 2: Runner
FROM python:3.13-slim AS runner

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set work directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy backend application code and other necessary files
COPY --from=builder /app/backend /app/backend
COPY --from=builder /app/alembic.ini /app/alembic.ini
COPY --from=builder /app/migrations /app/migrations

# Activate virtual environment
ENV PATH="/opt/venv/bin:$PATH"

# Create uploads directory and non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
RUN mkdir -p /app/uploads && chown app:app /app/uploads
USER app

# Expose port
EXPOSE 8000

# Default command (will be overridden by docker-compose for development)
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]