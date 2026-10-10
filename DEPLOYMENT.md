# EcoFinOps AI - Free Cloud Server Deployment Guide

EcoFinOps AI can be deployed on any free container or web hosting platform. The platform includes both the **NitroStack MCP Server (HTTP & SSE)** and the **Interactive Next.js Dashboard Widgets**, backed by the **Python ML Analytics Engine**.

---

## 🚀 Option 1: Render.com (Recommended - 100% Free)

Render provides a **free web service tier** with free automatic SSL certificates, global CDN, and custom subdomains.

### Steps to Deploy:
1. **Push your code to GitHub**:
   - Ensure your repo has [Dockerfile](file:///c:/Users/USER/OneDrive/Desktop/cloud%20computing/cc%20agents/Dockerfile) and [render.yaml](file:///c:/Users/USER/OneDrive/Desktop/cloud%20computing/cc%20agents/render.yaml).
2. **Sign in to Render**:
   - Visit [https://render.com](https://render.com) and log in with your GitHub account (free, no credit card required).
3. **Create New Web Service**:
   - Click **New +** > **Web Service**.
   - Select your repository (e.g. `EcoFinOps-AI`).
4. **Configure Settings**:
   - **Environment**: `Docker` (Auto-detected).
   - **Instance Type**: Select **Free** (512 MB RAM, 0.1 CPU).
   - **Port**: `3000` (or leave default).
5. **Deploy**:
   - Click **Create Web Service**.
   - Render will build the container and deploy it to a live public URL: `https://<your-app-name>.onrender.com`.

---

## ⚡ Option 2: Koyeb (100% Free Tier)

Koyeb offers high-performance free Nano instances with built-in continuous deployment from GitHub.

### Steps to Deploy:
1. Visit [https://app.koyeb.com](https://app.koyeb.com) and sign in with GitHub.
2. Click **Create App** > select **GitHub**.
3. Choose your repository.
4. Select **Dockerfile** build method.
5. Choose the **Free Nano** tier.
6. Click **Deploy**. Your app will be live at `https://<app-name>.koyeb.app`.

---

## 🛠️ Option 3: Railway.app (Hobby / Free Trial)

Railway provides one-click repository deployments with instant live metrics.

### Steps to Deploy:
1. Visit [https://railway.app](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select the repository. Railway automatically builds the multi-stage [Dockerfile](file:///c:/Users/USER/OneDrive/Desktop/cloud%20computing/cc%20agents/Dockerfile).
4. Click **Settings** > **Generate Domain** to get your public HTTPS URL.

---

## 🐳 Option 4: Local / Self-Hosted Cloud VM with Docker

If you have a free VPS (such as Oracle Cloud Free Tier Always-Free VM or Google Cloud Free Tier e2-micro):

```bash
# Build the image
docker compose build

# Start the service in background
docker compose up -d

# Check logs
docker compose logs -f
```

---

## 📡 Live Endpoints Provided by Your Deployment

Once deployed, your cloud server provides:
- **Interactive Dashboard UI**: `https://<your-domain>/dashboard`
- **Resource Utilization Widget**: `https://<your-domain>/resource-utilization`
- **Workload Schedule Comparison**: `https://<your-domain>/schedule-comparison`
- **MCP Streamable HTTP Endpoint**: `https://<your-domain>/mcp`
- **MCP Legacy SSE Stream**: `https://<your-domain>/sse`
- **Health Check Endpoint**: `https://<your-domain>/health`
