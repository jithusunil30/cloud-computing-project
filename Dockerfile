# ==============================================================================
# EcoFinOps AI - Universal Production Multi-Cloud Container Image
# Compatible with Render (Free Tier), Railway, Koyeb, Fly.io, AWS, GCP, Azure
# ==============================================================================

FROM node:20-bookworm-slim

# Install Python 3, pip, and venv for Debian bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up dedicated Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /app

# Install Python ML dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
COPY package*.json ./
COPY src/widgets/package*.json ./src/widgets/
RUN npm ci || npm install
RUN cd src/widgets && (npm ci || npm install)

# Copy workspace source code
COPY . .

# Compile TypeScript backend and Next.js widgets
RUN npm run build

# Production configuration
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV PYTHON_PATH=/opt/venv/bin/python

EXPOSE 3000

# Start production server (dual-transport: STDIO + HTTP/SSE + Widgets)
CMD ["node", "dist/index.js"]
