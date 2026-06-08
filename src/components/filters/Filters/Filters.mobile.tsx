"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, SlidersHorizontal, Calendar } from "lucide-react";
import { IssueStatus } from "@/features/dashboard/types";
import { ISSUE_STATUSES, STATUS_META_MAP } from "@/features/dashboard/constants";
import { FiltersProps } from "./Filters.types";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export function FiltersMobile({ filters, setFilters, resetFilters, options }: FiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.source.length > 0 ||
    filters.module.length > 0 ||
    filters.status.length > 0 ||
    filters.assignee.length > 0 ||
    !!filters.assignedDateStart ||
    !!filters.assignedDateEnd;

  const toggleStatus = (status: IssueStatus) => {
    setFilters((prev) => {
      const isSelected = prev.status.includes(status);
      return {
        ...prev,
        status: isSelected
          ? prev.status.filter((s) => s !== status)
          : [...prev.status, status],
      };
    });
  };

  const toggleModule = (module: string) => {
    setFilters((prev) => {
      const isSelected = prev.module.includes(module);
      return {
        ...prev,
        module: isSelected
          ? prev.module.filter((m) => m !== module)
          : [...prev.module, module],
      };
    });
  };

  const toggleSource = (source: "Admin" | "App") => {
    setFilters((prev) => {
      const isSelected = prev.source.includes(source);
      return {
        ...prev,
        source: isSelected ? prev.source.filter((s) => s !== source) : [...prev.source, source],
      };
    });
  };

  const toggleAssignee = (assignee: string) => {
    setFilters((prev) => {
      const isSelected = prev.assignee.includes(assignee);
      return {
        ...prev,
        assignee: isSelected
          ? prev.assignee.filter((a) => a !== assignee)
          : [...prev.assignee, assignee],
      };
    });
  };

  const activeCount =
    filters.source.length +
    filters.module.length +
    filters.status.length +
    filters.assignee.length +
    (filters.assignedDateStart || filters.assignedDateEnd ? 1 : 0);

  return (
    <div className="flex items-center gap-2 bg-zinc-950/20 p-2 rounded-lg border border-border/30">
      {/* Dynamic Mobile Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Search bugs..."
          className="pl-9 h-9 bg-zinc-900/40 border-border/20 text-xs text-white placeholder-zinc-500 focus-visible:ring-primary/45"
        />
      </div>

      {/* Filter Trigger Sheet */}
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="outline" size="sm" className="h-9 relative bg-zinc-900/40 border-border/20 text-zinc-300 gap-1.5 active:bg-zinc-900">
              <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs">Filters</span>
              {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white px-1 shadow-md">
                  {activeCount}
                </span>
              )}
            </Button>
          }
        />
        <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-zinc-950 border-l border-border/30 overflow-y-auto p-6 text-white">
          <SheetHeader className="pb-4 border-b border-border/20">
            <SheetTitle className="text-base font-bold text-white">Filter Issues</SheetTitle>
          </SheetHeader>

          <div className="py-4 space-y-6">
            {/* Source Section */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Source</h3>
              <div className="grid grid-cols-1 gap-2">
                {(["App", "Admin"] as const).map((src) => {
                  const isChecked = filters.source.includes(src);
                  return (
                    <div
                      key={src}
                      onClick={() => toggleSource(src)}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-900 cursor-pointer"
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <div className="flex-1 text-xs text-zinc-300 font-medium flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${src === "App" ? "bg-indigo-400" : "bg-teal-400"}`} />
                        {src}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Status</h3>
              <div className="grid grid-cols-1 gap-2">
                {ISSUE_STATUSES.map((status) => {
                  const isChecked = filters.status.includes(status);
                  const meta = STATUS_META_MAP[status];
                  return (
                    <div
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-900 cursor-pointer"
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <div className="flex-1 text-xs text-zinc-300 font-medium flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: meta?.chartColor }} />
                        {meta?.label || status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modules Section */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Modules</h3>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {options.modules.map((mod) => {
                  const isChecked = filters.module.includes(mod);
                  return (
                    <div
                      key={mod}
                      onClick={() => toggleModule(mod)}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-900 cursor-pointer"
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <div className="flex-1 text-xs text-zinc-300">
                        {mod}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assignees Section */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Assignees</h3>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {options.assignees.map((ass) => {
                  const isChecked = filters.assignee.includes(ass);
                  return (
                    <div
                      key={ass}
                      onClick={() => toggleAssignee(ass)}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-900 cursor-pointer"
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <div className="flex-1 text-xs text-zinc-300">
                        {ass}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dates Section */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Assigned Date
              </h3>
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[10px] text-zinc-400">Start Date</span>
                <CalendarComponent
                  mode="single"
                  selected={filters.assignedDateStart}
                  onSelect={(d) => setFilters((prev) => ({ ...prev, assignedDateStart: d }))}
                  className="bg-zinc-900/60 rounded-md border border-border/20 mx-auto"
                />
                
                <span className="text-[10px] text-zinc-400 mt-2">End Date</span>
                <CalendarComponent
                  mode="single"
                  selected={filters.assignedDateEnd}
                  onSelect={(d) => setFilters((prev) => ({ ...prev, assignedDateEnd: d }))}
                  className="bg-zinc-900/60 rounded-md border border-border/20 mx-auto"
                />
              </div>
            </div>

          </div>

          {/* Reset Action */}
          <div className="pt-4 border-t border-border/20 flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="flex-1 text-xs text-zinc-400 hover:text-white"
              >
                Clear All
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
