import { JobTable } from '@/components/JobTable';

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage your GPU jobs across different regions
        </p>
      </div>

      <JobTable />
    </div>
  );
}
