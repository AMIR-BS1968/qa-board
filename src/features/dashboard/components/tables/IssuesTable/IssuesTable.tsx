"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Copy, Check } from "lucide-react";
import { Issue } from "@/features/dashboard/types";
import { STATUS_META_MAP } from "@/features/dashboard/constants";
import { IssuesTableProps } from "./IssuesTable.types";
import { Skeleton } from "@/components/ui/skeleton";

export function IssuesTable({ issues, loading = false, onEditIssue, onStatusChange, statusOptions = [] }: IssuesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "assignedDate", desc: true }
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingStatusKey, setUpdatingStatusKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row edit when copying
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columnHelper = createColumnHelper<Issue>();

  const columns = useMemo(() => [
    columnHelper.accessor("issueStatus", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 text-zinc-400 hover:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: (info) => {
        const status = info.getValue();
        const issue = info.row.original;
        const meta = STATUS_META_MAP[status];
        const cellKey = `${issue.sheetSource}-${issue.sheetRowIndex}`;
        const isUpdating = updatingStatusKey === cellKey;

        if (onStatusChange && statusOptions.length > 0) {
          return (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <select
                value={status || ""}
                disabled={isUpdating}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  if (!newStatus || newStatus === status) return;
                  setUpdatingStatusKey(cellKey);
                  await onStatusChange(issue, newStatus);
                  setUpdatingStatusKey(null);
                }}
                className="appearance-none bg-zinc-900/60 border rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition disabled:opacity-50 disabled:cursor-wait"
                style={{
                  borderColor: meta?.chartColor ? `${meta.chartColor}40` : "#27272a",
                  color: meta?.chartColor || "#a1a1aa",
                }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt} style={{ background: "#09090b", color: "#d4d4d8" }}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <Badge className={`px-2.5 py-1 text-[11px] font-semibold border ${meta?.bgClass || ""}`}>
            <span className="h-1.5 w-1.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: meta?.chartColor }} />
            {meta?.label || status}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("issueTitle", {
      header: "Issue Title",
      cell: (info) => {
        const title = info.getValue();
        return (
          <div className="flex items-center gap-2 group max-w-sm">
            <span className="font-semibold text-white truncate group-hover:text-primary transition-colors duration-200">
              {title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-zinc-500 hover:text-white"
              onClick={(e) => copyToClipboard(title, e)}
            >
              {copiedId === title ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        );
      },
    }),
    columnHelper.accessor("module", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 text-zinc-400 hover:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Module
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: (info) => <Badge variant="secondary" className="bg-zinc-900 border-border/20 text-zinc-400">{info.getValue()}</Badge>,
    }),
    columnHelper.accessor("sheetSource", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 text-zinc-400 hover:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Source
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: (info) => {
        const source = info.getValue();
        const isApp = source === "App";
        return (
          <Badge
            className={`px-2.5 py-1 text-[11px] font-semibold border ${isApp
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "bg-teal-500/10 text-teal-400 border-teal-500/20"
              }`}
          >
            {source}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("reportedBy", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 text-zinc-400 hover:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Reporter
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: (info) => (
        <div className="flex items-center gap-2 text-zinc-400 font-medium text-xs">
          <span className="truncate">{info.getValue() || "—"}</span>
        </div>
      ),
    }),
    columnHelper.accessor("assignee", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 text-zinc-400 hover:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assignee
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: (info) => (
        <div className="flex items-center gap-2 text-zinc-300 font-medium">
          <div className="h-5 w-5 rounded-full bg-zinc-900 border border-border/20 flex items-center justify-center text-[10px] text-zinc-500">
            {(info.getValue() || "U").substring(0, 2).toUpperCase()}
          </div>
          <span className="truncate">{info.getValue() || "Unassigned"}</span>
        </div>
      ),
    }),
    columnHelper.accessor("assignedDate", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 text-zinc-400 hover:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: (info) => <span className="text-zinc-400 text-xs">{info.getValue() || "—"}</span>,
    }),
    columnHelper.accessor("estimation", {
      header: "Est.",
      cell: (info) => <span className="text-zinc-400 font-semibold text-xs">{info.getValue() || "—"}</span>,
    }),
    columnHelper.accessor("spentTime", {
      header: "Spent",
      cell: (info) => <span className="text-zinc-400 font-semibold text-xs">{info.getValue() || "—"}</span>,
    }),
  ], [copiedId, columnHelper]);

  const table = useReactTable({
    data: issues,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full bg-zinc-900 border border-border/20 rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-zinc-900/40 border border-border/10 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Table Structure */}
      <div className="rounded-xl border border-border/40 bg-zinc-950/20 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-950/40 border-b border-border/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-zinc-400 font-bold h-11 px-4 text-xs">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-zinc-500 text-sm">
                  No issues found matching the active filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onEditIssue?.(row.original)}
                  className="cursor-pointer border-b border-border/20 hover:bg-zinc-900/40 transition-colors duration-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-14 px-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-xs text-zinc-500 font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="bg-zinc-950 border-border/40 hover:bg-zinc-900 text-zinc-300 h-8"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="bg-zinc-950 border-border/40 hover:bg-zinc-900 text-zinc-300 h-8"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
