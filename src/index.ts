/**
 * EcoFinOps AI - Main Server Entry Point
 * 
 * Boots the NitroStack Dual Transport (HTTP/SSE + STDIO) MCP Server
 * and mounts the comprehensive EcoFinOps AI Interactive Web Portal
 * and standalone Next.js widgets at HTTP endpoints.
 */

import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { McpApplicationFactory, DIContainer } from '@nitrostack/core';
import { AppModule } from './app.module.js';
import { renderEcoFinOpsPortalHtml } from './portal/portal-template.js';
import { SupervisorOrchestrationAgent } from './modules/agents/agent-10-supervisor.service.js';
import { CloudTelemetryProviderService } from './modules/cloud/cloud-telemetry.service.js';

/**
 * Bootstrap the application
 */
async function bootstrap() {
  const host = process.env.HOST || '0.0.0.0';
  const port = parseInt(process.env.PORT || '3000', 10);

  // Create and initialize MCP Server application
  const server = await McpApplicationFactory.create(AppModule);
  await server.start({ host, port });

  // Enhance HTTP Transport with EcoFinOps AI Web Portal & interactive endpoints
  const httpTransport = (server as any)._httpTransport;
  if (httpTransport) {
    // 1. Override the root documentation page with the EcoFinOps AI Web Portal
    httpTransport.generateDocumentationPage = (tools: any, mcpEndpoint: string) => {
      return renderEcoFinOpsPortalHtml(tools, mcpEndpoint);
    };

    const app = httpTransport.getApp?.();
    if (app) {
      const widgetsOutDir = path.resolve(process.cwd(), 'src', 'widgets', 'out');

      // 2. Direct HTTP routes to standalone Next.js widgets
      app.get('/dashboard', (_req: any, res: any) => {
        const file = path.join(widgetsOutDir, 'dashboard.html');
        if (fs.existsSync(file)) return res.sendFile(file);
        res.redirect('/');
      });

      app.get('/resource-utilization', (_req: any, res: any) => {
        const file = path.join(widgetsOutDir, 'resource-utilization.html');
        if (fs.existsSync(file)) return res.sendFile(file);
        res.redirect('/');
      });

      app.get('/schedule-comparison', (_req: any, res: any) => {
        const file = path.join(widgetsOutDir, 'schedule-comparison.html');
        if (fs.existsSync(file)) return res.sendFile(file);
        res.redirect('/');
      });

      // 3. API endpoint: list 12 agents
      app.get('/api/agents', (_req: any, res: any) => {
        res.json({
          agents: [
            { id: 'agent-01-finops-analyst', name: 'FinOps Analyst', role: 'Cost Breakdown & Spend Drivers' },
            { id: 'agent-02-cost-forecasting', name: 'Cost Forecasting', role: 'Rolling-Origin Time-Series 95% CIs' },
            { id: 'agent-03-anomaly-detection', name: 'Anomaly Detection', role: 'Isolation Forest Spikes & Idle Nodes' },
            { id: 'agent-04-carbon-intelligence', name: 'Carbon Intelligence', role: 'Scope 2 GHG Emissions Modeling' },
            { id: 'agent-05-workload-scheduling', name: 'Workload Scheduling', role: 'Carbon-Intensity Workload Shifting' },
            { id: 'agent-06-resource-optimization', name: 'Resource Optimization', role: 'Rightsizing & p95 Peak Safeguards' },
            { id: 'agent-07-region-intelligence', name: 'Region Intelligence', role: 'Price, Grid Carbon & Latency Tiers' },
            { id: 'agent-08-multiobjective-optimizer', name: 'Multi-Objective Optimizer', role: 'Pareto Non-Dominated Frontiers' },
            { id: 'agent-09-recommendation-verification', name: 'Verification Agent', role: 'Deterministic Arithmetic Audits' },
            { id: 'agent-10-supervisor', name: 'Supervisor Agent', role: 'Intent Classification & Dispatch' },
            { id: 'agent-11-governance-risk', name: 'Governance & Risk', role: 'Read-Only Guardrails & Budget Rules' },
            { id: 'agent-12-reporting-explanation', name: 'Reporting & Explanation', role: 'Executive Briefings & Provenance' }
          ]
        });
      });

      // 4. API endpoint: execute live agent optimization
      app.post('/api/agents/run', async (req: any, res: any) => {
        try {
          const supervisor = DIContainer.getInstance().resolve(SupervisorOrchestrationAgent) as SupervisorOrchestrationAgent;
          const { scenario, prompt } = req.body || {};
          let targetPrompt: string = prompt;

          if (!targetPrompt) {
            switch (scenario) {
              case 'cross-domain':
                targetPrompt = 'Execute full cross-domain finops cost and carbon optimization with verified audit';
                break;
              case 'anomalies':
                targetPrompt = 'Detect multivariate spend anomalies and find idle zombie compute nodes';
                break;
              case 'forecast':
                targetPrompt = 'Generate 30-day forward cost forecast with 95% confidence intervals';
                break;
              case 'scheduling':
                targetPrompt = 'Schedule batch workloads to minimize Scope 2 carbon emissions';
                break;
              case 'verification':
                targetPrompt = 'Verify recommendation arithmetic and constraint satisfaction';
                break;
              case 'finops':
                targetPrompt = 'Analyze multi-cloud spend and ranked cost savings';
                break;
              case 'carbon':
                targetPrompt = 'Model Scope 2 GHG carbon emissions and energy consumed';
                break;
              case 'rightsizing':
                targetPrompt = 'Identify underutilized instances with p95 peak safeguards';
                break;
              case 'region':
                targetPrompt = 'Compare cloud regions by cost, carbon intensity, and latency';
                break;
              case 'pareto':
                targetPrompt = 'Compute Pareto optimal tradeoffs between cost, carbon, and latency';
                break;
              case 'governance':
                targetPrompt = 'Audit hard budget constraints and read-only guardrails';
                break;
              case 'report':
                targetPrompt = 'Synthesize executive briefing with calculation provenance';
                break;
              default:
                targetPrompt = 'Analyze multi-cloud spend and carbon emissions';
            }
          }

          const result = await supervisor.coordinate({ prompt: targetPrompt });
          res.json({
            success: true,
            classification: result.requestClassification || 'Optimization',
            verified: result.verificationSummary?.status === 'VERIFIED',
            summary: result.executiveSummary,
            traces: result.executionTrace,
            findings: result.findings
          });
        } catch (error: any) {
          console.error('[WebPortal API Error]', error);
          res.status(500).json({ error: error.message });
        }
      });

      // 5. Cloud Telemetry Live Connection Status
      app.get('/api/cloud/status', (_req: any, res: any) => {
        try {
          const telemetryService = DIContainer.getInstance().resolve(CloudTelemetryProviderService) as CloudTelemetryProviderService;
          res.json(telemetryService.getConnectionStatus());
        } catch (e: any) {
          res.status(500).json({ error: e.message });
        }
      });

      // 6. Live Telemetry Data Fetch (Live Internet Feeds + Cloud APIs)
      app.get('/api/cloud/telemetry', async (_req: any, res: any) => {
        try {
          const telemetryService = DIContainer.getInstance().resolve(CloudTelemetryProviderService) as CloudTelemetryProviderService;
          const snapshot = await telemetryService.getLiveTelemetrySnapshot();
          res.json(snapshot);
        } catch (e: any) {
          res.status(500).json({ error: e.message });
        }
      });

      // 7. Live 10-Second Telemetry Streaming Feed (Usage Chart, Active Resources, Real-time Loss & Cost)
      app.get('/api/cloud/live-stream', async (_req: any, res: any) => {
        try {
          const telemetryService = DIContainer.getInstance().resolve(CloudTelemetryProviderService) as CloudTelemetryProviderService;
          const streamData = await telemetryService.getLiveStreamData();
          res.json(streamData);
        } catch (e: any) {
          res.status(500).json({ error: e.message });
        }
      });
    }
  }
}

// Start the application
bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
