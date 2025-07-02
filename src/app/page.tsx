import { JobTable } from "@/components/JobTable"

export default function Home() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-12 space-y-4">
      <h1 className="text-3xl font-bold">Swift Node Explorer</h1>
      <h2 className="text-3xl font-bold">GPU Job Tracker</h2>
      <p className="text-muted-foreground">Monitor and manage your GPU jobs across different regions</p>
      <JobTable />
    </div>
  )
}
