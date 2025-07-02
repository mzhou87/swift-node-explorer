"use client";

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"
import { Copy, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

import { useJobs } from "@/hooks/useJobs";




export type Job = {
  id: string
  gpu: string
  region: string
  cost: number
  status: "running" | "completed" | "failed" | "queued" | "cancelled"
  runtime: string
  createdAt: string
  metadata: {
    instanceType: string
    memoryUsage: string
    cpuCores: number
    storageUsage: string
    owner: string
    project: string
    priority: "low" | "medium" | "high"
    description: string
    tags: string[]
    lastUpdated: string
    errorMessage?: string
  }
}

export function JobTable() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { toast } = useToast()
  const { data, isLoading, error } = useJobs();
  console.log(data);
  

  if (isLoading) {
    return <div>Loading jobs...</div>;
  }

  if (error) {
    return <div>Failed to load jobs.</div>;
  }
  const jobsData = data?.jobs || [];

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "id",
      header: "Job ID",
      cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "gpu",
      header: "GPU",
      cell: ({ row }) => <div>{row.getValue("gpu")}</div>,
      filterFn: "equals",
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }) => <div>{row.getValue("region")}</div>,
      filterFn: "equals",
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({ row }) => <div>${row.getValue<number>("cost").toFixed(2)}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status")
        return (
          <Badge
            variant="outline"
            className={`
              ${status === "running" ? "border-blue-500 text-blue-500 bg-blue-50" : ""}
              ${status === "completed" ? "border-green-500 text-green-500 bg-green-50" : ""}
              ${status === "failed" ? "border-red-500 text-red-500 bg-red-50" : ""}
              ${status === "queued" ? "border-yellow-500 text-yellow-500 bg-yellow-50" : ""}
              ${status === "cancelled" ? "border-gray-500 text-gray-500 bg-gray-50" : ""}
            `}
          >
            {status}
          </Badge>
        )
      },
      filterFn: "equals",
    },
    {
      accessorKey: "runtime",
      header: "Runtime",
      cell: ({ row }) => <div>{row.getValue("runtime")}</div>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Created At
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return <div>{date.toLocaleString()}</div>
      },
    },
  ]

  const table = useReactTable({
    data: jobsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  const uniqueGPUs = Array.from(new Set(jobsData.map((job) => job.gpu)))
  const uniqueRegions = Array.from(new Set(jobsData.map((job) => job.region)))
  const uniqueStatuses = Array.from(new Set(jobsData.map((job) => job.status)))

  const handleRowClick = (job: Job) => {
    setSelectedJob(job)
    setSheetOpen(true)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to clipboard`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <Select onValueChange={(value) => table.getColumn("gpu")?.setFilterValue(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by GPU" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All GPUs</SelectItem>
              {uniqueGPUs.map((gpu) => (
                <SelectItem key={gpu} value={gpu}>
                  {gpu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select onValueChange={(value) => table.getColumn("region")?.setFilterValue(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {uniqueRegions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          {selectedJob && (
            <>
              <SheetHeader>
                <SheetTitle>Job Details</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-80px)] pr-4">
                <div className="px-6 py-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-muted-foreground">Job ID</h3>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(selectedJob.id, "Job ID")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm font-mono">{selectedJob.id}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-muted-foreground">GPU</h3>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(selectedJob.gpu, "GPU")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm">{selectedJob.gpu}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Region</h3>
                      <p className="text-sm">{selectedJob.region}</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <Badge
                        variant="outline"
                        className={`
                          ${selectedJob.status === "running" ? "border-blue-500 text-blue-500 bg-blue-50" : ""}
                          ${selectedJob.status === "completed" ? "border-green-500 text-green-500 bg-green-50" : ""}
                          ${selectedJob.status === "failed" ? "border-red-500 text-red-500 bg-red-50" : ""}
                          ${selectedJob.status === "queued" ? "border-yellow-500 text-yellow-500 bg-yellow-50" : ""}
                          ${selectedJob.status === "cancelled" ? "border-gray-500 text-gray-500 bg-gray-50" : ""}
                        `}
                      >
                        {selectedJob.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Cost</h3>
                      <p className="text-sm">${selectedJob.cost.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Runtime</h3>
                      <p className="text-sm">{selectedJob.runtime}</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                      <p className="text-sm">{new Date(selectedJob.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                      <p className="text-sm">{new Date(selectedJob.metadata.lastUpdated).toLocaleString()}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Metadata</h3>
                    <div className="bg-muted rounded-md p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-muted-foreground">Instance Type</h4>
                          <p className="text-xs">{selectedJob.metadata.instanceType}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-muted-foreground">Memory Usage</h4>
                          <p className="text-xs">{selectedJob.metadata.memoryUsage}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-muted-foreground">CPU Cores</h4>
                          <p className="text-xs">{selectedJob.metadata.cpuCores}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-muted-foreground">Storage Usage</h4>
                          <p className="text-xs">{selectedJob.metadata.storageUsage}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Owner</h4>
                        <p className="text-xs">{selectedJob.metadata.owner}</p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Project</h4>
                        <p className="text-xs">{selectedJob.metadata.project}</p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Priority</h4>
                        <Badge variant="outline" className="text-xs">
                          {selectedJob.metadata.priority}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Description</h4>
                        <p className="text-xs">{selectedJob.metadata.description}</p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedJob.metadata.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {selectedJob.metadata.errorMessage && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-muted-foreground">Error Message</h4>
                          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-600">
                            {selectedJob.metadata.errorMessage}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
