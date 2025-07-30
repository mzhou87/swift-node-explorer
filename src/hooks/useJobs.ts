import { useQuery } from '@tanstack/react-query';

export type Job = {
  id: string;
  gpu: string;
  region: string;
  cost: number;
  status: 'running' | 'completed' | 'failed' | 'queued' | 'cancelled';
  runtime: number;
  createdAt: string;
  metadata: Record<string, unknown>; // If you have a type for this, use it!
};

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async (): Promise<Job[]> => {
      const res = await fetch('/api/jobs');
      if (!res.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await res.json();
      console.log('Raw data', data);

      // Transform the raw instances to your Job type:
      return (data.instances || []).map((instance: Record<string, unknown>) => ({
        id: String(instance.id),
        gpu: (instance.gpu_name as string) ?? 'Unknown GPU',
        region: (instance.geolocation as string) ?? 'Unknown',
        cost: (instance.dph_total as number) ?? 0,
        status: mapStatus(instance), // see below
        runtime: (instance.duration as number) ?? 0,
        createdAt: new Date((instance.start_date as number) * 1000).toISOString(),
        metadata: instance, // include the full JSON for detail view
      }));
    },
  });
}

// Optional helper to map Vast.ai state to your status:
function mapStatus(instance: Record<string, unknown>): Job['status'] {
  const status = ((instance.cur_state as string) || '').toLowerCase();
  if (status.includes('stop')) return 'completed';
  if (status.includes('running')) return 'running';
  if (status.includes('fail')) return 'failed';
  return 'queued'; // fallback
}
