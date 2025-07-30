import { JobTable } from "@/components/JobTable"
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-12 space-y-4">
      <Link href="/analytics">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          View Analytics Dashboard
        </button>
      </Link>

      
      <h1 className="py-3 text-3xl font-bold">GPU Job Tracker</h1>
      <p className="text-muted-foreground">Monitor and manage your GPU jobs across different regions</p>
      

      <JobTable />
      
    </div>
    
  )
}
