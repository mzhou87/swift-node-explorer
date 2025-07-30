"use client";

import { useState, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { Copy, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { exportToFile } from "@/lib/export";
import dayjs from "dayjs";

import { useJobs } from "@/hooks/useJobs";

export type Job = {
  id: string;
  gpu: string;
  region: string;
  cost: number;
  status: "running" | "completed" | "failed" | "queued" | "cancelled";
  runtime: number; // seconds for numeric filtering
  createdAt: string;
  metadata: any;
};



function handleExport(data: any[], filters: object, type: "csv" | "json") {
  const timestamp = dayjs().format("YYYYMMDD_HHmmss");
  const filename = `gpu_jobs_export_${timestamp}.${type}`;

  if (type === "csv") {
    const header = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    exportToFile(filename, `${header}\n${rows}`, "csv");
  } else {
    const json = JSON.stringify({ meta: { timestamp, filters }, jobs: data }, null, 2);
    exportToFile(filename, json, "json");
  }
}

export function JobTable() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();
  const { data } = useJobs();
  const jobsData = data || [];

  const uniqueRegions = Array.from(new Set(jobsData.map((job) => job.region)));
  const uniqueGPUs = Array.from(new Set(jobsData.map((job) => job.gpu)));

  // Cost range filter state + debounce
  const [costRange, setCostRange] = useState({ min: "", max: "" });
  const [debouncedCost, setDebouncedCost] = useState(costRange);

  useEffect(() => {
    const id = setTimeout(() => {
      table.getColumn("cost")?.setFilterValue(debouncedCost);
    }, 300);
    return () => clearTimeout(id);
  }, [debouncedCost]);

  const [minRuntime, setMinRuntime] = useState({ h: "", m: "", s: "" });
  const [maxRuntime, setMaxRuntime] = useState({ h: "", m: "", s: "" });

  useEffect(() => {
    table.getColumn("runtime")?.setFilterValue({ minRuntime, maxRuntime });
  }, [minRuntime, maxRuntime]);

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "id",
      header: "Job ID",
      cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("id")}</div>,
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
      header: "Hourly Cost ($)",
      filterFn: (row, columnId, filterValue) => {
        const val = row.getValue<number>(columnId);
        const min = parseFloat(filterValue.min);
        const max = parseFloat(filterValue.max);
        if (!isNaN(min) && val < min) return false;
        if (!isNaN(max) && val > max) return false;
        return true;
      },
      cell: ({ row }) => {
        const cost = row.getValue<number>("cost");
        return <div>${cost.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "runtime",
      header: "Runtime",
      filterFn: (row, columnId, filterValue) => {
        const val = row.getValue<number>(columnId);

        const min =
          (parseInt(filterValue.minRuntime?.h || "0") || 0) * 3600 +
          (parseInt(filterValue.minRuntime?.m || "0") || 0) * 60 +
          (parseInt(filterValue.minRuntime?.s || "0") || 0);

        const max =
          (parseInt(filterValue.maxRuntime?.h || "0") || 0) * 3600 +
          (parseInt(filterValue.maxRuntime?.m || "0") || 0) * 60 +
          (parseInt(filterValue.maxRuntime?.s || "0") || 0);

        if ((filterValue.minRuntime && val < min) || (filterValue.maxRuntime && max > 0 && val > max)) {
          return false;
        }

        return true;
      },
      cell: ({ row }) => {
        const sec = row.getValue<number>("runtime");
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Created At
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div>{date.toLocaleString()}</div>;
      },
    },
  ];

  const table = useReactTable({
    data: jobsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  const handleRowClick = (job: Job) => {
    setSelectedJob(job);
    setSheetOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text).then(() => {
        toast(`${label} copied`, { description: "Copied to clipboard." });
      });
    };
    
  

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Region */}
        <Select onValueChange={(val) => table.getColumn("region")?.setFilterValue(val === "all" ? undefined : val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {uniqueRegions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* GPU */}
        <Select onValueChange={(val) => table.getColumn("gpu")?.setFilterValue(val === "all" ? undefined : val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="GPU" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {uniqueGPUs.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Cost */}
        <Input
          placeholder="Min Cost"
          type="number"
          value={costRange.min}
          onChange={(e) => {
            const val = e.target.value;
            setCostRange((prev) => ({ ...prev, min: val }));
            setDebouncedCost({ ...costRange, min: val });
          }}
          className="w-24"
        />
        <Input
          placeholder="Max Cost"
          type="number"
          value={costRange.max}
          onChange={(e) => {
            const val = e.target.value;
            setCostRange((prev) => ({ ...prev, max: val }));
            setDebouncedCost({ ...costRange, max: val });
          }}
          className="w-24"
        />

        {/* Runtime Min */}
        <div className="flex gap-1">
          <Input placeholder="Min H" className="w-17" value={minRuntime.h} onChange={(e) => setMinRuntime((p) => ({ ...p, h: e.target.value }))} />
          <Input placeholder="Min M" className="w-17" value={minRuntime.m} onChange={(e) => setMinRuntime((p) => ({ ...p, m: e.target.value }))} />
          <Input placeholder="Min S" className="w-17" value={minRuntime.s} onChange={(e) => setMinRuntime((p) => ({ ...p, s: e.target.value }))} />
        </div>

        {/* Runtime Max */}
        <div className="flex gap-1">
          <Input placeholder="Max H" className="w-18" value={maxRuntime.h} onChange={(e) => setMaxRuntime((p) => ({ ...p, h: e.target.value }))} />
          <Input placeholder="Max M" className="w-18" value={maxRuntime.m} onChange={(e) => setMaxRuntime((p) => ({ ...p, m: e.target.value }))} />
          <Input placeholder="Max S" className="w-18" value={maxRuntime.s} onChange={(e) => setMaxRuntime((p) => ({ ...p, s: e.target.value }))} />
        </div>

        <Button
        className="ml-auto"
        onClick={() =>
          handleExport(table.getFilteredRowModel().rows.map(r => r.original), columnFilters, "csv")
        }
      >
        Export CSV
        </Button>
      
    </div>

      <div className="rounded border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} onClick={() => handleRowClick(row.original)} className="hover:bg-muted/50 cursor-pointer">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          {selectedJob && (
            <>
              <SheetHeader>
                <SheetTitle>Job Details</SheetTitle>
              </SheetHeader>
              <ScrollArea className="pr-4">
                <div className="space-y-4 p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm">Job ID</h3>
                    <Button onClick={() => copyToClipboard(selectedJob.id, "Job ID")} size="icon" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="bg-muted rounded p-2 text-xs">{selectedJob.id}</pre>

                  <div className="flex justify-between items-center">
                    <h3 className="text-sm">GPU</h3>
                    <Button onClick={() => copyToClipboard(selectedJob.gpu, "GPU")} size="icon" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="bg-muted rounded p-2 text-xs">{selectedJob.gpu}</pre>

                  <Separator />
                  <h3 className="text-sm">Full Metadata</h3>
                  <pre className="bg-muted rounded p-2 text-xs overflow-x-auto">{JSON.stringify(selectedJob, null, 2)}</pre>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
