# EcoFinOps AI: Multi-Agent Cloud FinOps & Carbon-Aware Optimization Platform

EcoFinOps AI is an enterprise-grade Cloud FinOps and Carbon-Aware Workload Optimization platform built on **NitroStack**, **Model Context Protocol (MCP)**, and **Machine Learning**. It features 12 specialized autonomous agents that perform cost optimization, time-series forecasting, anomaly detection, Scope 2 GHG carbon modeling, workload scheduling, rightsizing safeguards, and deterministic recommendation verification.

---

## 🌟 Key Features

- **12 Autonomous Specialist Agents**:
  1. `FinOps Analyst`: Cost breakdown, spend drivers, budget pacing, and ranked savings.
  2. `Cost Forecasting`: Rolling-origin time-series forecasting with 95% confidence intervals and MAE/RMSE/MAPE error metrics.
  3. `Anomaly Detection`: Multivariate Isolation Forest and Z-score spike identification with zombie resource detection.
  4. `Carbon Intelligence`: Scope 2 GHG emissions modeling (kg CO2e) and energy consumption tracking (kWh).
  5. `Workload Scheduling`: Carbon-intensity aligned batch shifting within hard deadline and cluster capacity bounds.
  6. `Resource Optimization`: Rightsizing underutilized instances with p95 peak CPU safeguards.
  7. `Cloud Region Intelligence`: Multi-cloud region comparison across pricing, grid carbon intensity, and latency.
  8. `Multi-Objective Optimizer`: Pareto non-dominated frontier and normalized objective scalarization.
  9. `Recommendation Verification`: Deterministic arithmetic audits preventing phantom or exaggerated savings.
  10. `Supervisor & Orchestration`: Intent classification, selective dispatch, and cycle-free execution traces.
  11. `Governance & Risk`: Hard read-only guardrails, budget violation detection, and secret sanitization.
  12. `Reporting & Explanation`: Executive briefings, calculation provenance, caveats, and exportable reports.
- **Dual Runtime Architecture**: High-speed TypeScript MCP orchestration + Python scientific ML engine (`pandas`, `numpy`, `scikit-learn`).
- **Interactive UI Widgets**: Next.js dashboard widgets for real-time visualization (`/dashboard`, `/resource-utilization`, `/schedule-comparison`).
- **Safety First**: Strict read-only safety guardrails ensuring zero cloud mutation without human authorization.

---

## 🚀 Free Cloud Deployment (Render, Koyeb, Railway)

EcoFinOps AI includes a production-ready **multi-stage Docker container** and **Render Blueprint** for 100% free cloud hosting:

- See the complete deployment guide in [DEPLOYMENT.md](file:///c:/Users/USER/OneDrive/Desktop/cloud%20computing/cc%20agents/DEPLOYMENT.md).
- Ready-to-use Docker container: [Dockerfile](file:///c:/Users/USER/OneDrive/Desktop/cloud%20computing/cc%20agents/Dockerfile).
- 1-Click Render Blueprint: [render.yaml](file:///c:/Users/USER/OneDrive/Desktop/cloud%20computing/cc%20agents/render.yaml).

---

## 🧪 Testing

```bash
# Run 12-agent TypeScript unit tests (51 tests)
npm run test:unit

# Run end-to-end integration workflows (32 tests)
npm run test:integration

# Run Python ML test suite
npm run test:python
```

---

## 🛠️ Local Development & Production Run

```bash
# Build TypeScript and Next.js widgets
npm run build

# Start production server (dual HTTP/SSE and STDIO)
npm start
```
