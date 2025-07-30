'use client';

import { useState, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table';
import { Copy, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { FilterPanel } from '@/components/ui/filter-panel';
import { ExportButton } from '@/components/ui/export-button';
import { useToast } from '@/hooks/use-toast';
import { exportToFile } from '@/lib/export';
import { useJobs } from '@/hooks/useJobs';
import { cn } from '@/lib/utils';

dayjs.extend(relativeTime);

export type Job = {
  id: string;
  gpu: string;
  region: string;
  cost: number;
  status: 'running' | 'completed' | 'failed' | 'queued' | 'cancelled';
  runtime: number; // seconds for numeric filtering
  createdAt: string;
  metadata: Record<string, unknown>;
};

function handleExport(
  data: Record<string, unknown>[],
  filters: object,
  type: 'csv' | 'json',
  toast: (message: string, options?: { description?: string }) => void
) {
  const timestamp = dayjs().format('YYYYMMDD_HHmmss');
  const filename = `gpu_jobs_export_${timestamp}.${type}`;

  if (type === 'csv') {
    const header = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(',')).join('\n');
    exportToFile(filename, `${header}\n${rows}`, 'csv');
  } else {
    const json = JSON.stringify({ meta: { timestamp, filters }, jobs: data }, null, 2);
    exportToFile(filename, json, 'json');
  }

  toast(`Export completed successfully`, {
    description: `Downloaded ${filename}`,
  });
}

export function JobTable() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();
  const { data, isLoading } = useJobs();
  const jobsData = data || [];

  const uniqueRegions = Array.from(new Set(jobsData.map((job) => job.region)));
  const uniqueGPUs = Array.from(new Set(jobsData.map((job) => job.gpu)));

  // Cost range filter state + debounce
  const [costRange, setCostRange] = useState({ min: '', max: '' });
  const [debouncedCost, setDebouncedCost] = useState(costRange);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedCost(costRange);
    }, 300);
    return () => clearTimeout(id);
  }, [costRange]);

  useEffect(() => {
    table.getColumn('cost')?.setFilterValue(debouncedCost);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCost]);

  const [minRuntime, setMinRuntime] = useState({ h: '', m: '', s: '' });
  const [maxRuntime, setMaxRuntime] = useState({ h: '', m: '', s: '' });

  useEffect(() => {
    table.getColumn('runtime')?.setFilterValue({ minRuntime, maxRuntime });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRuntime, maxRuntime]);

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: 'id',
      header: 'Job ID',
      cell: ({ row }) => (
        <div className="font-mono text-xs max-w-[120px] truncate" title={row.getValue('id')}>
          {row.getValue('id')}
        </div>
      ),
    },
    {
      accessorKey: 'gpu',
      header: 'GPU',
      cell: ({ row }) => <div className="font-medium">{row.getValue('gpu')}</div>,
      filterFn: 'equals',
    },
    {
      accessorKey: 'region',
      header: 'Region',
      cell: ({ row }) => <div>{row.getValue('region')}</div>,
      filterFn: 'equals',
    },
    {
      accessorKey: 'cost',
      header: 'Hourly Cost ($)',
      filterFn: (row, columnId, filterValue) => {
        const val = row.getValue<number>(columnId);
        const min = parseFloat(filterValue.min);
        const max = parseFloat(filterValue.max);
        if (!isNaN(min) && val < min) return false;
        if (!isNaN(max) && val > max) return false;
        return true;
      },
      cell: ({ row }) => {
        const cost = row.getValue<number>('cost');
        return <div className="font-medium">${cost.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const variants = {
          running: 'default',
          completed: 'secondary',
          failed: 'destructive',
          queued: 'outline',
          cancelled: 'outline',
        } as const;

        return (
          <Badge
            variant={variants[status as keyof typeof variants] || 'outline'}
            className="text-xs"
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'runtime',
      header: 'Runtime',
      filterFn: (row, columnId, filterValue) => {
        const val = row.getValue<number>(columnId);

        const min =
          (parseInt(filterValue.minRuntime?.h || '0') || 0) * 3600 +
          (parseInt(filterValue.minRuntime?.m || '0') || 0) * 60 +
          (parseInt(filterValue.minRuntime?.s || '0') || 0);

        const max =
          (parseInt(filterValue.maxRuntime?.h || '0') || 0) * 3600 +
          (parseInt(filterValue.maxRuntime?.m || '0') || 0) * 60 +
          (parseInt(filterValue.maxRuntime?.s || '0') || 0);

        if (
          (filterValue.minRuntime && val < min) ||
          (filterValue.maxRuntime && max > 0 && val > max)
        ) {
          return false;
        }

        return true;
      },
      cell: ({ row }) => {
        const sec = row.getValue<number>('runtime');
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return (
          <div className="font-mono text-sm">
            {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:
            {s.toString().padStart(2, '0')}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created At
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = dayjs(row.getValue('createdAt'));
        return (
          <div className="text-sm">
            <div className="font-medium">{date.fromNow()}</div>
            <div className="text-xs text-muted-foreground">{date.format('MMM D, YYYY HH:mm')}</div>
          </div>
        );
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
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { sorting, columnFilters, pagination },
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const totalRowCount = table.getCoreRowModel().rows.length;

  const handleRowClick = (job: Job) => {
    setSelectedJob(job);
    setSheetOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast(`${label} copied!`, {
        description: 'Copied to clipboard.',
      });
    });
  };

  const resetFilters = () => {
    setColumnFilters([]);
    setCostRange({ min: '', max: '' });
    setMinRuntime({ h: '', m: '', s: '' });
    setMaxRuntime({ h: '', m: '', s: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GPU Jobs</h2>
          <p className="text-muted-foreground">
            {filteredRowCount === totalRowCount
              ? `Showing ${totalRowCount} jobs`
              : `Showing ${filteredRowCount} of ${totalRowCount} jobs`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            onExport={(format) =>
              handleExport(
                table.getFilteredRowModel().rows.map((r) => r.original),
                columnFilters,
                format,
                toast
              )
            }
            disabled={filteredRowCount === 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <FilterPanel title="Job Filters" defaultExpanded={true}>
            <div className="space-y-4">
              {/* Region Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Region</label>
                <Select
                  onValueChange={(val) =>
                    table.getColumn('region')?.setFilterValue(val === 'all' ? undefined : val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All regions</SelectItem>
                    {uniqueRegions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* GPU Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">GPU Type</label>
                <Select
                  onValueChange={(val) =>
                    table.getColumn('gpu')?.setFilterValue(val === 'all' ? undefined : val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All GPUs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All GPUs</SelectItem>
                    {uniqueGPUs.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cost Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Range ($)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={costRange.min}
                    onChange={(e) => setCostRange((prev) => ({ ...prev, min: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={costRange.max}
                    onChange={(e) => setCostRange((prev) => ({ ...prev, max: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Runtime Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Runtime</label>
                <div className="flex gap-1">
                  <Input
                    placeholder="H"
                    value={minRuntime.h}
                    onChange={(e) => setMinRuntime((p) => ({ ...p, h: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="M"
                    value={minRuntime.m}
                    onChange={(e) => setMinRuntime((p) => ({ ...p, m: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="S"
                    value={minRuntime.s}
                    onChange={(e) => setMinRuntime((p) => ({ ...p, s: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Runtime</label>
                <div className="flex gap-1">
                  <Input
                    placeholder="H"
                    value={maxRuntime.h}
                    onChange={(e) => setMaxRuntime((p) => ({ ...p, h: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="M"
                    value={maxRuntime.m}
                    onChange={(e) => setMaxRuntime((p) => ({ ...p, m: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="S"
                    value={maxRuntime.s}
                    onChange={(e) => setMaxRuntime((p) => ({ ...p, s: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button variant="outline" onClick={resetFilters} className="w-full">
                Reset Filters
              </Button>
            </div>
          </FilterPanel>
        </div>

        {/* Main Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      Loading jobs...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      onClick={() => handleRowClick(row.original)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/50',
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      No jobs found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">Rows per page:</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          {selectedJob && (
            <>
              <SheetHeader className="pb-6">
                <SheetTitle>Job Details</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  {/* Job Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Job Information</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-muted-foreground">
                            Job ID
                          </label>
                          <Button
                            onClick={() => copyToClipboard(selectedJob.id, 'Job ID')}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="font-mono text-xs bg-muted rounded p-2 break-all">
                          {selectedJob.id}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div>
                          <Badge variant="outline">{selectedJob.status}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-muted-foreground">GPU</label>
                          <Button
                            onClick={() => copyToClipboard(selectedJob.gpu, 'GPU')}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="font-medium">{selectedJob.gpu}</div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Region</label>
                        <div className="font-medium">{selectedJob.region}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Cost</label>
                        <div className="font-medium">${selectedJob.cost.toFixed(2)}/hr</div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Runtime</label>
                        <div className="font-mono text-sm">
                          {(() => {
                            const sec = selectedJob.runtime;
                            const h = Math.floor(sec / 3600);
                            const m = Math.floor((sec % 3600) / 60);
                            const s = Math.floor(sec % 60);
                            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <div>
                        <div className="font-medium">{dayjs(selectedJob.createdAt).fromNow()}</div>
                        <div className="text-sm text-muted-foreground">
                          {dayjs(selectedJob.createdAt).format('MMMM D, YYYY [at] h:mm A')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Metadata Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Full Metadata</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedJob.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
