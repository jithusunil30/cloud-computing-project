/**
 * SYNTHETIC DEMONSTRATION DATA — not real billing or telemetry.
 *
 * Resource inventory for the EcoFinOps AI demo workspace. Usage samples are
 * generated deterministically from each resource's `profile` by
 * `usage.generator.ts`, so every run yields identical numbers.
 */

export interface UsageProfile {
  /** Mean daily CPU utilisation (%) */
  baseCpu: number;
  /** +/- jitter applied to daily CPU (%) */
  cpuJitter: number;
  /** Mean daily memory utilisation (%) */
  baseMem: number;
  /** Optional ISO date from which load increases by `spikeFactor` */
  spikeFrom?: string;
  spikeFactor?: number;
}

export interface ResourceRecord {
  resourceId: string;
  name: string;
  provider: 'aws';
  region: string;
  service: string;
  resourceType: string;
  /** On-demand price in USD per hour (synthetic pricing assumption) */
  hourlyRateUsd: number;
  /** Minimum vCPU the owning team requires (used to avoid unsafe rightsizing) */
  vcpu: number;
  imageUrl: string;
  profile: UsageProfile;
}

const IMG = {
  rack: 'https://images.unsplash.com/photo-1762163516269-3c143e04175c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHwxfHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwxfDB8fHwxNzkxNTY1NjY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  fans: 'https://images.unsplash.com/photo-1782094673136-5198a372980c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHwyfHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwxfDB8fHwxNzkxNTY1NjY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  switch: 'https://images.unsplash.com/photo-1783683783819-e6cb806bba69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHwzfHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwxfDB8fHwxNzkxNTY1NjY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  tech: 'https://images.unsplash.com/photo-1785682117394-4c8d27afc12a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHw0fHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwxfDB8fHwxNzkxNTY1NjY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  cables: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHwxfHxkYXRhYmFzZSUyMHN0b3JhZ2UlMjBzZXJ2ZXJzfGVufDF8MHx8fDE3OTE1NjU2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  serverRoom: 'https://images.unsplash.com/photo-1695668548342-c0c1ad479aee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHwyfHxkYXRhYmFzZSUyMHN0b3JhZ2UlMjBzZXJ2ZXJzfGVufDF8MHx8fDE3OTE1NjU2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  dataServers: 'https://images.unsplash.com/photo-1506399558188-acca6f8cbf41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHwzfHxkYXRhYmFzZSUyMHN0b3JhZ2UlMjBzZXJ2ZXJzfGVufDF8MHx8fDE3OTE1NjU2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  wires: 'https://images.unsplash.com/photo-1667264501379-c1537934c7ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHw0fHxkYXRhYmFzZSUyMHN0b3JhZ2UlMjBzZXJ2ZXJzfGVufDF8MHx8fDE3OTE1NjU2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  cloud: 'https://images.unsplash.com/photo-1667984390538-3dea7a3fe33d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHwxfHxjbG91ZCUyMGNvbXB1dGluZyUyMG5ldHdvcmt8ZW58MXwwfHx8MTc5MTU2NTcwMnww&ixlib=rb-4.1.0&q=80&w=1080',
  render: 'https://images.unsplash.com/photo-1690627931320-16ac56eb2588?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5OTQ3NTl8MHwxfHNlYXJjaHwyfHxjbG91ZCUyMGNvbXB1dGluZyUyMG5ldHdvcmt8ZW58MXwwfHx8MTc5MTU2NTcwMnww&ixlib=rb-4.1.0&q=80&w=1080',
};

export const RESOURCES: ResourceRecord[] = [
  {
    resourceId: 'i-0a1b2c3d4e5f60001', name: 'legacy-reporting-vm', provider: 'aws', region: 'us-east-1',
    service: 'EC2', resourceType: 'm5.2xlarge', hourlyRateUsd: 0.384, vcpu: 8, imageUrl: IMG.rack,
    profile: { baseCpu: 3.5, cpuJitter: 1.5, baseMem: 14 },
  },
  {
    resourceId: 'i-0a1b2c3d4e5f60002', name: 'staging-api-02', provider: 'aws', region: 'us-east-1',
    service: 'EC2', resourceType: 'c5.xlarge', hourlyRateUsd: 0.17, vcpu: 4, imageUrl: IMG.fans,
    profile: { baseCpu: 7, cpuJitter: 3, baseMem: 22 },
  },
  {
    resourceId: 'i-0a1b2c3d4e5f60003', name: 'prod-web-frontend-01', provider: 'aws', region: 'us-east-1',
    service: 'EC2', resourceType: 'c5.2xlarge', hourlyRateUsd: 0.34, vcpu: 8, imageUrl: IMG.switch,
    profile: { baseCpu: 58, cpuJitter: 12, baseMem: 61 },
  },
  {
    resourceId: 'db-ecofin-analytics-01', name: 'analytics-postgres', provider: 'aws', region: 'us-east-1',
    service: 'RDS', resourceType: 'db.r5.xlarge', hourlyRateUsd: 0.5, vcpu: 4, imageUrl: IMG.dataServers,
    profile: { baseCpu: 6, cpuJitter: 2.5, baseMem: 28 },
  },
  {
    resourceId: 'db-ecofin-orders-01', name: 'orders-mysql', provider: 'aws', region: 'us-east-1',
    service: 'RDS', resourceType: 'db.m5.large', hourlyRateUsd: 0.171, vcpu: 2, imageUrl: IMG.serverRoom,
    profile: { baseCpu: 41, cpuJitter: 9, baseMem: 55 },
  },
  {
    resourceId: 'i-0a1b2c3d4e5f60006', name: 'ml-batch-worker-01', provider: 'aws', region: 'us-east-1',
    service: 'EC2', resourceType: 'g4dn.xlarge', hourlyRateUsd: 0.526, vcpu: 4, imageUrl: IMG.tech,
    profile: { baseCpu: 22, cpuJitter: 6, baseMem: 35, spikeFrom: '2026-09-20', spikeFactor: 2.6 },
  },
  {
    resourceId: 'cache-ecofin-sessions-01', name: 'sessions-redis', provider: 'aws', region: 'us-east-1',
    service: 'ElastiCache', resourceType: 'cache.m5.large', hourlyRateUsd: 0.156, vcpu: 2, imageUrl: IMG.cables,
    profile: { baseCpu: 4.5, cpuJitter: 2, baseMem: 18 },
  },
  {
    resourceId: 'i-0a1b2c3d4e5f60008', name: 'ci-runner-large', provider: 'aws', region: 'us-east-1',
    service: 'EC2', resourceType: 'm5.4xlarge', hourlyRateUsd: 0.768, vcpu: 16, imageUrl: IMG.wires,
    profile: { baseCpu: 12, cpuJitter: 10, baseMem: 30 },
  },
  {
    resourceId: 'i-0e9f8d7c6b5a40009', name: 'eu-batch-scheduler', provider: 'aws', region: 'eu-west-1',
    service: 'EC2', resourceType: 'm5.xlarge', hourlyRateUsd: 0.214, vcpu: 4, imageUrl: IMG.cloud,
    profile: { baseCpu: 5, cpuJitter: 2, baseMem: 20 },
  },
  {
    resourceId: 'i-0e9f8d7c6b5a40010', name: 'eu-web-frontend-01', provider: 'aws', region: 'eu-west-1',
    service: 'EC2', resourceType: 'c5.xlarge', hourlyRateUsd: 0.192, vcpu: 4, imageUrl: IMG.render,
    profile: { baseCpu: 49, cpuJitter: 11, baseMem: 58 },
  },
];

/** Dataset coverage of the synthetic usage generator (inclusive, UTC). */
export const DATASET_COVERAGE = { start: '2026-08-01', end: '2026-10-31' };
export const DATASET_LABEL = 'SYNTHETIC demo dataset (ecofinops-demo-v1) — not real telemetry or billing';
