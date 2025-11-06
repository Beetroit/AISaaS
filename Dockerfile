FROM python:3.13-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app/backend

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install UV package manager
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install Python dependencies into the system environment
RUN uv pip install --system -r pyproject.toml

# Create uploads directory and non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
RUN mkdir -p /app/uploads && chown app:app /app/uploads
USER app

# Expose port
EXPOSE 8000

# Default command (will be overridden by docker-compose for development)
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]