type Job = {
  id: string;
  cost: number;
  gpuUsed: number;
  runtime: number; // in seconds
  tags: string[];
  region: string;
  gpuType: string;
};

type AggregationKey = 'tags' | 'region' | 'gpuType';

type AggregatedData = {
  totalCost: number;
  totalGpuUsed: number;
  averageRuntime: number;
  count: number;
};

export function calculateAggregates(
  jobs: Job[],
  groupBy: AggregationKey
): Record<string, AggregatedData> {
  const aggregates: Record<string, AggregatedData> = {};

  for (const job of jobs) {
    const keys = Array.isArray(job[groupBy]) ? job[groupBy] : [job[groupBy]];

    for (const key of keys) {
      if (!aggregates[key]) {
        aggregates[key] = {
          totalCost: 0,
          totalGpuUsed: 0,
          averageRuntime: 0,
          count: 0,
        };
      }

      const group = aggregates[key];
      group.totalCost += job.cost;
      group.totalGpuUsed += job.gpuUsed;
      group.averageRuntime += job.runtime;
      group.count += 1;
    }
  }

  for (const key in aggregates) {
    const group = aggregates[key];
    group.averageRuntime = group.count > 0 ? group.averageRuntime / group.count : 0;
  }

  return aggregates;
}
