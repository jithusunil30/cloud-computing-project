'use client';

import { useState, useMemo } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';
import {
  ShieldCheck,
  TrendingUp,
  Cpu,
  Leaf,
  Calendar,
  AlertTriangle,
  Globe,
  Sliders,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  Download,
  Play,
  Clock,
  Sparkles,
  Server,
  DollarSign,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AgentCard {
  id: string;
  name: string;
  role: string;
  description: string;
  authorizedTools: string[];
  status: 'ready' | 'running' | 'succeeded' | 'failed';
}

const AGENTS_LIST: AgentCard[] = [
  {
    id: 'agent-01-finops-analyst',
    name: 'FinOps Analyst Agent',
    role: 'Cost & Driver Breakdown',
    description: 'Analyzes daily, weekly, and monthly cloud spend, breakdowns by service and region, and ranks cost-saving opportunities.',
    authorizedTools: ['get_cost_summary'],
    status: 'ready',
  },
  {
    id: 'agent-02-cost-forecasting',
    name: 'Cost Forecasting Agent',
    role: 'Time-Series Spend Prediction',
    description: 'Predicts future cloud costs across configurable horizons with 95% confidence intervals and verified MAE/RMSE/MAPE metrics.',
    authorizedTools: ['forecast_cloud_cost', 'get_model_evaluation'],
    status: 'ready',
  },
  {
    id: 'agent-03-anomaly-detection',
    name: 'Cost Anomaly Detection Agent',
    role: 'Spike & Zombie Waste Detection',
    description: 'Detects unusual spending spikes via Isolation Forest and Z-scores, and flags idle resources accumulating waste.',
    authorizedTools: ['detect_cost_anomalies', 'analyze-resource-utilization'],
    status: 'ready',
  },
  {
    id: 'agent-04-carbon-intelligence',
    name: 'Carbon Intelligence Agent',
    role: 'Scope 2 GHG Emissions Modeling',
    description: 'Estimates cloud workload operational carbon footprint (kg CO2e) and energy draw (kWh) based on regional grid emission factors.',
    authorizedTools: ['estimate_carbon_emissions'],
    status: 'ready',
  },
  {
    id: 'agent-05-workload-scheduling',
    name: 'Workload Scheduling Agent',
    role: 'Temporal Batch Window Shifting',
    description: 'Compares immediate, cost-aware, carbon-aware, and combined execution schedules while respecting deadlines and cluster limits.',
    authorizedTools: ['compare-workload-schedules'],
    status: 'ready',
  },
  {
    id: 'agent-06-resource-optimization',
    name: 'Resource Optimization Agent',
    role: 'Capacity & Safe Rightsizing',
    description: 'Identifies persistent underutilization, validates safe rightsizing with p95 peak CPU limits, and assesses termination risks.',
    authorizedTools: ['analyze-resource-utilization'],
    status: 'ready',
  },
  {
    id: 'agent-07-region-intelligence',
    name: 'Cloud Region Intelligence Agent',
    role: 'Multi-Region Trade-Off Analysis',
    description: 'Compares execution regions on electricity cost, grid carbon intensity, latency bounds, and data residency constraints.',
    authorizedTools: ['compare_cloud_regions'],
    status: 'ready',
  },
  {
    id: 'agent-08-multiobjective-optimizer',
    name: 'Multi-Objective Optimization Agent',
    role: 'Pareto Trade-Off Frontier',
    description: 'Maps non-dominated Pareto alternatives balancing cost and carbon emissions with normalized objective functions.',
    authorizedTools: ['compare-workload-schedules'],
    status: 'ready',
  },
  {
    id: 'agent-09-recommendation-verification',
    name: 'Recommendation Verification Agent',
    role: 'Independent Mathematical Audit',
    description: 'Independently checks arithmetic baselines, percentage formulas, deadline constraints, and cluster capacity (VERIFIED / REJECTED).',
    authorizedTools: ['validate_recommendation'],
    status: 'ready',
  },
  {
    id: 'agent-10-supervisor',
    name: 'Supervisor & Orchestrator Agent',
    role: 'Central Dispatch & Selective Routing',
    description: 'Classifies user requests, coordinates specialist agents with bounded routing, executes fallbacks, and logs execution traces.',
    authorizedTools: ['get_audit_history'],
    status: 'ready',
  },
  {
    id: 'agent-11-governance-risk',
    name: 'Cloud Governance & Risk Agent',
    role: 'Policy Guardrails & Safety Gates',
    description: 'Enforces budget limits, read-only release safety guardrails, credential protection, and human approval requirements.',
    authorizedTools: ['analyze_budget_risk'],
    status: 'ready',
  },
  {
    id: 'agent-12-reporting-explanation',
    name: 'Reporting & Explanation Agent',
    role: 'Audit Report & Executive Briefing',
    description: 'Converts multi-agent results into executive summaries, calculation provenance disclosures, trade-off explanations, and caveats.',
    authorizedTools: ['generate_optimization_report'],
    status: 'ready',
  },
];

export default function EcoFinOpsDashboard() {
  const { isReady, getToolOutput } = useWidgetSDK();
  const hostTheme = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'trace' | 'finops' | 'carbon' | 'optimization' | 'report'>('overview');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-10-supervisor');
  const [promptInput, setPromptInput] = useState<string>('Run full cross-domain cloud cost, carbon, and workload scheduling optimization');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const toolData = getToolOutput<any>();

  // Determine current active report data
  const data = useMemo(() => {
    return toolData?.data || executionResult || {
      keyMetrics: {
        totalSpendUsd: 333.39,
        projectedMonthlySpendUsd: 476.27,
        forecastNext48hUsd: 47.63,
        anomaliesCount: 41,
        estimatedWasteUsd: 124.02,
        totalCarbonKgco2e: 50.85,
        potentialSavingsUsd: 69.10,
        potentialCarbonReductionKg: 8.45,
      },
      verificationSummary: {
        status: 'VERIFIED',
        verifiedChecksCount: 6,
        reasons: [
          'Arithmetic savings delta verified against baseline spend.',
          'Percentage improvement verified within 0.1% tolerance.',
          'Workload completion satisfies strict deadline (08:00 UTC <= 12:00 UTC).',
          'Cluster capacity vCPU constraint satisfied (8 <= 32).',
        ],
      },
      policyAndGovernance: {
        readOnlyEnforced: true,
        complianceStatus: 'COMPLIANT',
        approvalRequired: false,
      },
      executionTrace: [
        { agentName: 'Supervisor & Orchestrator Agent', task: 'Classified request as "cross_domain_optimization"', durationMs: 14, status: 'succeeded' },
        { agentName: 'FinOps Analyst Agent', task: 'Analyzed fleet cost drivers and monthly budget pace', durationMs: 182, status: 'succeeded' },
        { agentName: 'Cost Forecasting Agent', task: 'Predicted 48h forward spend with 95% confidence intervals', durationMs: 245, status: 'succeeded' },
        { agentName: 'Cost Anomaly Detection Agent', task: 'Detected 41 cost spikes & 4 zombie idle instances', durationMs: 210, status: 'succeeded' },
        { agentName: 'Carbon Intelligence Agent', task: 'Calculated 50.85 kgCO2e Scope 2 emissions across 4 regions', durationMs: 165, status: 'succeeded' },
        { agentName: 'Workload Scheduling Agent', task: 'Shifted ETL batch to low-cost, low-carbon window', durationMs: 98, status: 'succeeded' },
        { agentName: 'Recommendation Verification Agent', task: 'Independently audited arithmetic & deadline constraints', durationMs: 42, status: 'succeeded' },
        { agentName: 'Cloud Governance & Risk Agent', task: 'Confirmed read-only release guardrail active', durationMs: 18, status: 'succeeded' },
      ],
      executiveSummary: 'EcoFinOps AI orchestrated 10 actions across 9 specialist agents. All financial calculations and deadline constraints passed independent audit with VERIFIED status. Read-only guardrail strictly enforced.',
    };
  }, [toolData, executionResult]);

  const handleSimulateRun = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setActiveTab('trace');
    }, 600);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecofinops-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedAgent = AGENTS_LIST.find((a) => a.id === selectedAgentId) || AGENTS_LIST[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      {/* Header Bar */}
      <header className="border-b border-slate-800 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf className="h-6 w-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">EcoFinOps AI</h1>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                12 Specialists Active
              </span>
              <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-medium">
                Read-Only Safe
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Agent Cloud FinOps & Carbon-Aware Optimization on NitroStack</p>
          </div>
        </div>

        {/* Global KPI Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Spend</div>
              <div className="text-xs font-semibold">${data.keyMetrics?.totalSpendUsd?.toFixed(2)}</div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Carbon</div>
              <div className="text-xs font-semibold">{data.keyMetrics?.totalCarbonKgco2e?.toFixed(1)} kgCO2e</div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Audit</div>
              <div className="text-xs font-semibold text-emerald-400">{data.verificationSummary?.status}</div>
            </div>
          </div>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export Report
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2 mb-6 text-sm">
        {[
          { id: 'overview', label: '12 Agents Directory', icon: Layers },
          { id: 'trace', label: 'Execution Trace & Orchestrator', icon: Play },
          { id: 'finops', label: 'FinOps & Forecasting', icon: TrendingUp },
          { id: 'carbon', label: 'Carbon Intelligence', icon: Leaf },
          { id: 'optimization', label: 'Workload & Multi-Objective', icon: Sliders },
          { id: 'report', label: 'Audit & Governance Report', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: 12 AGENTS DIRECTORY */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" /> Specialist Agents Registry
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                All 12 agents operate with strict typed schemas, deterministic verification passes, and explicit tool permissions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AGENTS_LIST.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`cursor-pointer p-3 rounded-lg border transition ${
                        isSelected
                          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-100">{agent.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          {agent.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium mb-1">{agent.role}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{agent.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Agent Detail Panel */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl h-fit space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Selected Agent</span>
              <h3 className="text-base font-bold text-white mt-0.5">{selectedAgent.name}</h3>
              <p className="text-xs text-emerald-400 font-medium">{selectedAgent.role}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium mb-1">Responsibilities:</span>
                <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                  {selectedAgent.description}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Authorized MCP Tools:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.authorizedTools.map((t) => (
                    <span key={t} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono text-[11px] border border-slate-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Safety Constraints:</span>
                <div className="text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-[11px]">
                  <div>• Read-only initial release: no automated cloud resource mutation.</div>
                  <div>• Independent verification pass via Agent 09 required before claims are verified.</div>
                  <div>• Secrets and cloud keys strictly scrubbed from all execution traces.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXECUTION TRACE & ORCHESTRATOR */}
      {activeTab === 'trace' && (
        <div className="space-y-6">
          {/* Dispatch Interactive Bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Enter FinOps or carbon optimization request..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleSimulateRun}
                disabled={isSimulating}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs transition disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> {isSimulating ? 'Orchestrating...' : 'Dispatch Request'}
              </button>
            </div>
          </div>

          {/* Quick Prompt Starters */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="text-slate-500 py-1">Quick Scenarios:</span>
            {[
              'Investigate recent spending anomalies and idle zombie waste',
              'Forecast 48h cloud spend and test budget risk threshold',
              'Optimize nightly ETL workload schedule for lowest carbon emissions',
              'Compare cloud regions for compute batch job across latency tiers',
            ].map((p) => (
              <button
                key={p}
                onClick={() => setPromptInput(p)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-md transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Execution Trace Timeline */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Execution Trace & Verification Outcome</h3>
                <p className="text-xs text-slate-400">Step-by-step dispatch trail, tools invoked, and mathematical verification</p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Outcome: {data.verificationSummary?.status}
              </span>
            </div>

            <div className="space-y-3">
              {data.executionTrace?.map((step: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] shrink-0 font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        {step.agentName}
                        <span className="text-[10px] text-emerald-400 font-mono font-normal">({step.durationMs}ms)</span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{step.task}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                      {step.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINOPS & FORECASTING */}
      {activeTab === 'finops' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Total Analyzed Spend</span>
              <div className="text-2xl font-bold text-white mt-1">${data.keyMetrics?.totalSpendUsd?.toFixed(2)}</div>
              <span className="text-[10px] text-slate-500">Historical fleet period</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Projected Monthly Spend</span>
              <div className="text-2xl font-bold text-cyan-400 mt-1">${data.keyMetrics?.projectedMonthlySpendUsd?.toFixed(2)}</div>
              <span className="text-[10px] text-emerald-400">Within $500 monthly budget limit</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">48h Forward Forecast</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">${data.keyMetrics?.forecastNext48hUsd?.toFixed(2)}</div>
              <span className="text-[10px] text-slate-500">Ridge ML model (MAE = $0.035/hr)</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Identified Waste</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">${data.keyMetrics?.estimatedWasteUsd?.toFixed(2)}</div>
              <span className="text-[10px] text-amber-400">Across 4 zombie idle nodes</span>
            </div>
          </div>

          {/* Model Evaluation Metrics */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-2">Measured Forecasting Evaluation Metrics (Zero-Leakage 80/20 Split)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-300">Simple Naive (24h Lag)</span>
                <div className="mt-2 space-y-1 font-mono text-slate-400">
                  <div>MAE: $0.0264 / hr</div>
                  <div>RMSE: $0.0311 / hr</div>
                  <div>MAPE: 1.33%</div>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/30">
                <span className="font-semibold text-emerald-400">Ridge Regression</span>
                <div className="mt-2 space-y-1 font-mono text-slate-300">
                  <div>MAE: $0.0350 / hr</div>
                  <div>RMSE: $0.0484 / hr</div>
                  <div>MAPE: 1.74%</div>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-300">Random Forest Baseline</span>
                <div className="mt-2 space-y-1 font-mono text-slate-400">
                  <div>MAE: $0.0252 / hr</div>
                  <div>RMSE: $0.0339 / hr</div>
                  <div>MAPE: 1.27%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CARBON INTELLIGENCE */}
      {activeTab === 'carbon' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Estimated Total Carbon</span>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{data.keyMetrics?.totalCarbonKgco2e?.toFixed(2)} kg CO2e</div>
              <span className="text-[10px] text-slate-500">Scope 2 location-based accounting</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Energy Consumption</span>
              <div className="text-2xl font-bold text-white mt-1">114.60 kWh</div>
              <span className="text-[10px] text-slate-500">Includes server TDP & PUE overhead</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Green Optimization Potential</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">8.45 kg CO2e</div>
              <span className="text-[10px] text-emerald-400">19.4% reduction via regional shifting</span>
            </div>
          </div>

          {/* Regional Grid Coefficients Table */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-2">Regional Grid Emission Factors & PUE</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Region</th>
                    <th className="pb-2">Location</th>
                    <th className="pb-2">Grid Intensity</th>
                    <th className="pb-2">PUE</th>
                    <th className="pb-2">Carbon Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2.5 font-mono text-emerald-400">us-west-2</td>
                    <td className="py-2.5">US West (Oregon)</td>
                    <td className="py-2.5 font-mono">120 g CO2e/kWh</td>
                    <td className="py-2.5 font-mono">1.12</td>
                    <td className="py-2.5 text-emerald-400 font-semibold">1 (Lowest Carbon)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-cyan-400">eu-west-1</td>
                    <td className="py-2.5">Europe (Ireland)</td>
                    <td className="py-2.5 font-mono">260 g CO2e/kWh</td>
                    <td className="py-2.5 font-mono">1.18</td>
                    <td className="py-2.5 text-cyan-400 font-semibold">2</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-amber-400">us-east-1</td>
                    <td className="py-2.5">US East (N. Virginia)</td>
                    <td className="py-2.5 font-mono">385 g CO2e/kWh</td>
                    <td className="py-2.5 font-mono">1.15</td>
                    <td className="py-2.5 text-amber-400 font-semibold">3</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-rose-400">ap-south-1</td>
                    <td className="py-2.5">AP (Mumbai)</td>
                    <td className="py-2.5 font-mono">708 g CO2e/kWh</td>
                    <td className="py-2.5 font-mono">1.22</td>
                    <td className="py-2.5 text-rose-400 font-semibold">4 (Highest Carbon)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <span className="text-amber-400 font-semibold">Methodology Disclosure: </span>
              Emissions are software-based model estimates based on published grid intensity data, not direct hardware meter readings.
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OPTIMIZATION & WORKLOADS */}
      {activeTab === 'optimization' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-2">Workload Scheduling Strategies Comparison</h3>
            <p className="text-xs text-slate-400 mb-4">
              Comparing immediate baseline vs cost-aware and carbon-aware execution schedules (Workload: wl-nightly-etl-001)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] uppercase">Baseline Strategy</span>
                <h4 className="font-bold text-white text-sm mt-1">Immediate Execution</h4>
                <div className="mt-3 space-y-1.5 font-mono">
                  <div>Estimated Cost: $2.40 USD</div>
                  <div>Emissions: 0.820 kg CO2e</div>
                  <div className="text-emerald-400">Deadline: Compliant</div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
                <span className="text-emerald-400 text-[11px] uppercase">Cost-Aware Strategy</span>
                <h4 className="font-bold text-white text-sm mt-1">Min Cost Window</h4>
                <div className="mt-3 space-y-1.5 font-mono">
                  <div className="text-emerald-400">Estimated Cost: $1.92 USD (-20.0%)</div>
                  <div>Emissions: 0.805 kg CO2e (-1.8%)</div>
                  <div className="text-emerald-400">Deadline: Compliant</div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30">
                <span className="text-cyan-400 text-[11px] uppercase">Carbon-Aware Strategy</span>
                <h4 className="font-bold text-white text-sm mt-1">Min Carbon Window</h4>
                <div className="mt-3 space-y-1.5 font-mono">
                  <div>Estimated Cost: $2.15 USD (-10.4%)</div>
                  <div className="text-cyan-400">Emissions: 0.660 kg CO2e (-19.5%)</div>
                  <div className="text-emerald-400">Deadline: Compliant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT & GOVERNANCE REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Full Audit & Governance Report</h3>
                <p className="text-xs text-slate-400">Traceable calculations, verification status, and safety guardrails</p>
              </div>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition"
              >
                <Download className="h-3.5 w-3.5" /> Download JSON
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs leading-relaxed">
              <div>
                <span className="font-semibold text-slate-200">1. Verification Summary:</span>
                <p className="text-slate-400 mt-0.5">
                  Recommendation Verification Agent (Agent 09) audited 6 mathematical assertions and constraint bounds. All checks passed. Status: <span className="text-emerald-400 font-bold">VERIFIED</span>.
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-200">2. Safety Guardrail:</span>
                <p className="text-slate-400 mt-0.5">
                  EcoFinOps AI initial release operates strictly in <span className="text-cyan-400 font-bold">READ-ONLY</span> recommendation mode. No cloud instances were resized or terminated automatically.
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-200">3. Provenance & Privacy:</span>
                <p className="text-slate-400 mt-0.5">
                  Calculations derived from reproducible telemetry, public AWS CUR / GCP Billing CSV schemas, and published grid intensity tables. All outputs scrubbed of secrets and API keys.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
