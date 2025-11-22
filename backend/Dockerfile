FROM python:3.13-slim

RUN apt-get update && apt-get install -y \
libpq-dev \
gcc \
&& rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY server/pyproject.toml server/uv.lock ./

# Install dependencies using uv
RUN uv sync --frozen --no-dev

# Copy the rest of the server code
COPY server/ ./

# Run the application
CMD ["uv", "run", "main.py"]