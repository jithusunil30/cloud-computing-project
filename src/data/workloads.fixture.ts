/**
 * SYNTHETIC / ILLUSTRATIVE scheduling data.
 * Carbon intensity and interval prices below are illustrative scenario values,
 * NOT measured grid data or real provider prices. They exist so the scheduler
 * can be demonstrated and tested deterministically.
 */

export interface WorkloadRecord {
  workloadId: string;
  name: string;
  region: string;
  priority: 'low' | 'medium' | 'high';
  /** ISO timestamp the workload becomes runnable */
  arrival: string;
  /** Latest ISO timestamp by which the workload must FINISH */
  deadline: string;
  durationHours: number;
  /** vCPU required while running */
  vcpuRequired: number;
  /** Assumed average power draw while running (kW) — documented estimation assumption */
  assumedPowerKw: number;
  imageUrl: string;
}

export interface IntervalRecord {
  /** Interval start (ISO, hourly) */
  start: string;
  /** Illustrative grid carbon intensity, gCO2e/kWh */
  carbonIntensityG: number;
  /** Illustrative compute price, USD per vCPU-hour */
  priceUsdPerVcpuHour: number;
  /** vCPU already reserved by other workloads in this interval */
  reservedVcpu: number;
}

export const CLUSTER_CAPACITY_VCPU = 128;

export const CARBON_SOURCE = {
  source: 'Illustrative scenario profile (ecofinops-demo-v1), shaped after a typical diurnal grid pattern',
  units: 'gCO2e/kWh',
  measured: false,
  scope: 'Operational emissions only (embodied emissions excluded)',
};

export const WORKLOADS: WorkloadRecord[] = [
  {
    workloadId: 'wl-nightly-etl-001',
    name: 'Nightly ETL — billing warehouse load',
    region: 'us-east-1',
    priority: 'medium',
    arrival: '2026-09-15T22:00:00Z',
    deadline: '2026-09-16T12:00:00Z',
    durationHours: 3,
    vcpuRequired: 32,
    assumedPowerKw: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHwxfHxkYXRhYmFzZSUyMHN0b3JhZ2UlMjBzZXJ2ZXJzfGVufDF8MHx8fDE3OTE1NjU2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    workloadId: 'wl-ml-training-002',
    name: 'Weekly churn model retraining',
    region: 'us-east-1',
    priority: 'low',
    arrival: '2026-09-15T22:00:00Z',
    deadline: '2026-09-16T12:00:00Z',
    durationHours: 5,
    vcpuRequired: 64,
    assumedPowerKw: 9.5,
    imageUrl: 'https://images.unsplash.com/photo-1785682117394-4c8d27afc12a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHw0fHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwxfDB8fHwxNzkxNTY1NjY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

/**
 * Hourly us-east-1 intervals from 2026-09-15T22:00Z to 2026-09-16T11:00Z.
 * Carbon dips overnight (low demand / wind), price dips in early-morning hours,
 * so cost-optimal and carbon-optimal windows intentionally differ.
 */
const RAW: Array<[string, number, number, number]> = [
  // start,                   gCO2e/kWh, USD/vCPU-h, reservedVcpu
  ['2026-09-15T22:00:00Z', 412, 0.0420, 40],
  ['2026-09-15T23:00:00Z', 398, 0.0405, 48],
  ['2026-09-16T00:00:00Z', 371, 0.0360, 72],
  ['2026-09-16T01:00:00Z', 342, 0.0310, 104],
  ['2026-09-16T02:00:00Z', 318, 0.0285, 88],
  ['2026-09-16T03:00:00Z', 296, 0.0270, 56],
  ['2026-09-16T04:00:00Z', 284, 0.0262, 40],
  ['2026-09-16T05:00:00Z', 289, 0.0258, 32],
  ['2026-09-16T06:00:00Z', 305, 0.0251, 24],
  ['2026-09-16T07:00:00Z', 334, 0.0249, 24],
  ['2026-09-16T08:00:00Z', 368, 0.0256, 48],
  ['2026-09-16T09:00:00Z', 401, 0.0330, 64],
  ['2026-09-16T10:00:00Z', 423, 0.0395, 80],
  ['2026-09-16T11:00:00Z', 436, 0.0430, 80],
];

export const INTERVALS: Record<string, IntervalRecord[]> = {
  'us-east-1': RAW.map(([start, carbonIntensityG, priceUsdPerVcpuHour, reservedVcpu]) => ({
    start,
    carbonIntensityG,
    priceUsdPerVcpuHour,
    reservedVcpu,
  })),
};
