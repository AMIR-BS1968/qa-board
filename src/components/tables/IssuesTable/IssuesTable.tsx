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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowUpDown, Copy, Check, ExternalLink, Calendar, User, Tag, Clock } from "lucide-react";
import { Issue } from "@/features/dashboard/types";
import { STATUS_META_MAP } from "@/features/dashboard/constants";
import { IssuesTableProps } from "./IssuesTable.types";
import { Skeleton } from "@/components/ui/skeleton";

export function IssuesTable({ issues, loading = false }: IssuesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "assignedDate", desc: true } // Default sort latest first
  ]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening the detail drawer when copying
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
        const meta = STATUS_META_MAP[status];
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
            className={`px-2.5 py-1 text-[11px] font-semibold border ${
              isApp
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "bg-teal-500/10 text-teal-400 border-teal-500/20"
            }`}
          >
            {source}
          </Badge>
        );
      },
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
            {info.getValue().substring(0, 2).toUpperCase()}
          </div>
          <span className="truncate">{info.getValue()}</span>
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
                  onClick={() => setSelectedIssue(row.original)}
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

      {/* Slide-out Detail Sheet */}
      <Sheet open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        {selectedIssue && (
          <SheetContent className="w-[500px] sm:max-w-[600px] bg-zinc-950 border-l border-border/30 text-white overflow-y-auto p-8">
            <SheetHeader className="pb-4 border-b border-border/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`px-2.5 py-0.5 text-[10px] font-semibold border ${STATUS_META_MAP[selectedIssue.issueStatus]?.bgClass || ""}`}>
                  {STATUS_META_MAP[selectedIssue.issueStatus]?.label || selectedIssue.issueStatus}
                </Badge>
                <Badge className={`px-2.5 py-0.5 text-[10px] font-semibold border ${selectedIssue.sheetSource === "App" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-teal-500/10 text-teal-400 border-teal-500/20"}`}>
                  {selectedIssue.sheetSource}
                </Badge>
                <span className="text-[10px] font-semibold text-zinc-500 font-mono">Est: {selectedIssue.estimation || "—"}</span>
              </div>
              <SheetTitle className="text-xl font-extrabold text-white leading-snug">
                {selectedIssue.issueTitle}
              </SheetTitle>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Context Grid */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-4 rounded-xl border border-border/10">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    Module / Feature
                  </span>
                  <p className="text-xs font-semibold text-zinc-200">
                    {selectedIssue.module} &rsaquo; {selectedIssue.feature}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    Assignee
                  </span>
                  <p className="text-xs font-semibold text-zinc-200">{selectedIssue.assignee}</p>
                </div>
                <div className="space-y-1 pt-2 border-t border-border/10">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Assigned Date
                  </span>
                  <p className="text-xs text-zinc-300 font-medium">{selectedIssue.assignedDate || "—"}</p>
                </div>
                <div className="space-y-1 pt-2 border-t border-border/10">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Resolution Date
                  </span>
                  <p className="text-xs text-zinc-300 font-medium">{selectedIssue.resolutionDate || "—"}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description</h3>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/10 p-3 rounded-lg border border-border/10 whitespace-pre-line">
                  {selectedIssue.issueDescription || "No description provided."}
                </p>
              </div>

              {/* Steps to Reproduce */}
              {selectedIssue.stepsToReproduce && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Steps to Reproduce</h3>
                  <pre className="text-[11px] font-mono text-zinc-300 bg-zinc-900/60 p-4 rounded-xl border border-border/25 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {selectedIssue.stepsToReproduce}
                  </pre>
                </div>
              )}

              {/* Dev Comments */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Developer Comments</h3>
                <div className="text-xs text-zinc-300 bg-zinc-900/20 p-3 rounded-lg border border-border/10">
                  {selectedIssue.devComments || <span className="text-zinc-600 italic">No developer comments yet.</span>}
                </div>
              </div>

              {/* QA Comments */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">QA Verification Comments</h3>
                <div className="text-xs text-zinc-300 bg-zinc-900/20 p-3 rounded-lg border border-border/10">
                  {selectedIssue.qaComments || <span className="text-zinc-600 italic">No QA comments yet.</span>}
                </div>
              </div>

              {/* Links & Attachments */}
              {selectedIssue.resources && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Resources & Attachments</h3>
                  <a
                    href={selectedIssue.resources}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    View Resource Link
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
