/**
 * Deterministic SYNTHETIC daily usage generator.
 * Produces one sample per resource per UTC day across DATASET_COVERAGE.
 * Uses a seeded PRNG (mulberry32) so outputs are reproducible for tests and demos.
 */
import { RESOURCES, DATASET_COVERAGE, ResourceRecord } from './resources.fixture.js';

export interface DailyUsageSample {
  date: string; // YYYY-MM-DD (UTC)
  resourceId: string;
  region: string;
  cpuAvgPct: number;
  cpuMaxPct: number;
  memAvgPct: number;
  runtimeHours: number;
  costUsd: number;
  currency: 'USD';
  synthetic: true;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export function* eachDay(start: string, end: string): Generator<string> {
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (d.getTime() <= last.getTime()) {
    yield d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

function generateFor(resource: ResourceRecord): DailyUsageSample[] {
  const rand = mulberry32(hashString(resource.resourceId));
  const out: DailyUsageSample[] = [];
  const p = resource.profile;
  for (const date of eachDay(DATASET_COVERAGE.start, DATASET_COVERAGE.end)) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.8 : 1;
    const spike = p.spikeFrom && date >= p.spikeFrom ? p.spikeFactor ?? 1 : 1;
    const cpuAvg = clamp((p.baseCpu + (rand() * 2 - 1) * p.cpuJitter) * weekendFactor * spike, 0.2, 99);
    const cpuMax = clamp(cpuAvg * (1.6 + rand() * 0.8), cpuAvg, 100);
    const memAvg = clamp(p.baseMem + (rand() * 2 - 1) * 4, 1, 99);
    const runtimeHours = 24;
    out.push({
      date,
      resourceId: resource.resourceId,
      region: resource.region,
      cpuAvgPct: round(cpuAvg),
      cpuMaxPct: round(cpuMax),
      memAvgPct: round(memAvg),
      runtimeHours,
      costUsd: round(resource.hourlyRateUsd * runtimeHours, 4),
      currency: 'USD',
      synthetic: true,
    });
  }
  return out;
}

let cache: DailyUsageSample[] | null = null;

export function getUsageSamples(): DailyUsageSample[] {
  if (!cache) cache = RESOURCES.flatMap(generateFor);
  return cache;
}
