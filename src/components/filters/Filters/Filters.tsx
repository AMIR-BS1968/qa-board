"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronDown, X, Calendar } from "lucide-react";
import { IssueStatus } from "@/features/dashboard/types";
import { ISSUE_STATUSES, STATUS_META_MAP } from "@/features/dashboard/constants";
import { FiltersProps } from "./Filters.types";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export function Filters({ filters, setFilters, resetFilters, options }: FiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.source.length > 0 ||
    filters.module.length > 0 ||
    filters.status.length > 0 ||
    filters.assignee.length > 0 ||
    filters.reportedBy.length > 0 ||
    !!filters.assignedDateStart ||
    !!filters.assignedDateEnd;

  const toggleSource = (source: "Admin" | "App") => {
    setFilters((prev) => {
      const isSelected = prev.source.includes(source);
      return {
        ...prev,
        source: isSelected
          ? prev.source.filter((s) => s !== source)
          : [...prev.source, source],
      };
    });
  };

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

  const toggleReportedBy = (reporter: string) => {
    setFilters((prev) => {
      const isSelected = prev.reportedBy.includes(reporter);
      return {
        ...prev,
        reportedBy: isSelected
          ? prev.reportedBy.filter((r) => r !== reporter)
          : [...prev.reportedBy, reporter],
      };
    });
  };

  return (
    <div className="flex flex-col gap-4 bg-zinc-950/20 backdrop-blur-md border border-border/40 p-4 rounded-xl">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search issue title, description, module or assignee..."
            className="pl-10 bg-zinc-900/40 border-border/30 text-white placeholder-zinc-500 focus-visible:ring-primary/50"
          />
        </div>

        {/* Source Filter */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="h-10 bg-zinc-900/40 border-border/30 text-zinc-300 hover:text-white hover:bg-zinc-900/70 gap-2">
                <span>Source</span>
                {filters.source.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-bold">
                    {filters.source.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </Button>
            }
          />
          <PopoverContent className="w-44 p-2 bg-zinc-950 border-border/40" align="start">
            <div className="space-y-1">
              {(["App", "Admin"] as const).map((src) => {
                const isChecked = filters.source.includes(src);
                return (
                  <div
                    key={src}
                    onClick={() => toggleSource(src)}
                    className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-900 cursor-pointer transition-colors duration-200"
                  >
                    <Checkbox checked={isChecked} className="pointer-events-none" />
                    <div className="flex-1 text-sm text-zinc-300 font-medium flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${src === "App" ? "bg-indigo-400" : "bg-teal-400"}`} />
                      {src}
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* 1. Status Multi-select Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="h-10 bg-zinc-900/40 border-border/30 text-zinc-300 hover:text-white hover:bg-zinc-900/70 gap-2">
                <span>Status</span>
                {filters.status.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-bold">
                    {filters.status.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </Button>
            }
          />
          <PopoverContent className="w-56 p-2 bg-zinc-950 border-border/40" align="start">
            <div className="space-y-1">
              {ISSUE_STATUSES.map((status) => {
                const isChecked = filters.status.includes(status);
                const meta = STATUS_META_MAP[status];
                return (
                  <div
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-900 cursor-pointer transition-colors duration-200"
                  >
                    <Checkbox checked={isChecked} className="pointer-events-none" />
                    <div className="flex-1 text-sm text-zinc-300 font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta?.chartColor }} />
                      {meta?.label || status}
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* 2. Module Multi-select Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="h-10 bg-zinc-900/40 border-border/30 text-zinc-300 hover:text-white hover:bg-zinc-900/70 gap-2">
                <span>Module</span>
                {filters.module.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-bold">
                    {filters.module.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </Button>
            }
          />
          <PopoverContent className="w-56 p-2 bg-zinc-950 border-border/40" align="start">
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {options.modules.length === 0 ? (
                <p className="text-xs text-zinc-500 p-2">No modules available</p>
              ) : (
                options.modules.map((mod) => {
                  const isChecked = filters.module.includes(mod);
                  return (
                    <div
                      key={mod}
                      onClick={() => toggleModule(mod)}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-900 cursor-pointer transition-colors duration-200"
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <div className="flex-1 text-sm text-zinc-300 font-medium">
                        {mod}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* 3. Assignee Multi-select Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="h-10 bg-zinc-900/40 border-border/30 text-zinc-300 hover:text-white hover:bg-zinc-900/70 gap-2">
                <span>Assignee</span>
                {filters.assignee.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-bold">
                    {filters.assignee.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </Button>
            }
          />
          <PopoverContent className="w-56 p-2 bg-zinc-950 border-border/40" align="start">
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {options.assignees.length === 0 ? (
                <p className="text-xs text-zinc-500 p-2">No assignees available</p>
              ) : (
                options.assignees.map((ass) => {
                  const isChecked = filters.assignee.includes(ass);
                  return (
                    <div
                      key={ass}
                      onClick={() => toggleAssignee(ass)}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-900 cursor-pointer transition-colors duration-200"
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <div className="flex-1 text-sm text-zinc-300 font-medium">
                        {ass}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* 3.5 Reported By Multi-select Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="h-10 bg-zinc-900/40 border-border/30 text-zinc-300 hover:text-white hover:bg-zinc-900/70 gap-2">
                <span>Reported By</span>
                {filters.reportedBy.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-bold">
                    {filters.reportedBy.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </Button>
            }
          />
          <PopoverContent className="w-56 p-2 bg-zinc-950 border-border/40" align="start">
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {options.reporters.length === 0 ? (
                <p className="text-xs text-zinc-500 p-2">No reporters available</p>
              ) : (
                options.reporters.map((rep) => {
                  const isChecked = filters.reportedBy.includes(rep);
                  return (
                    <div
                      key={rep}
                      onClick={() => toggleReportedBy(rep)}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-zinc-900 cursor-pointer transition-colors duration-200"
                    >
                      <Checkbox checked={isChecked} className="pointer-events-none" />
                      <div className="flex-1 text-sm text-zinc-300 font-medium">
                        {rep}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* 4. Date Picker Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="h-10 bg-zinc-900/40 border-border/30 text-zinc-300 hover:text-white hover:bg-zinc-900/70 gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span>Assigned Date</span>
                {(filters.assignedDateStart || filters.assignedDateEnd) && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-4 bg-zinc-950 border-border/40" align="start">
            <div className="flex gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-zinc-400 font-semibold">From</span>
                <CalendarComponent
                  mode="single"
                  selected={filters.assignedDateStart}
                  onSelect={(d) => setFilters((prev) => ({ ...prev, assignedDateStart: d }))}
                  className="bg-zinc-900/40 rounded-md border border-border/20"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-zinc-400 font-semibold">To</span>
                <CalendarComponent
                  mode="single"
                  selected={filters.assignedDateEnd}
                  onSelect={(d) => setFilters((prev) => ({ ...prev, assignedDateEnd: d }))}
                  className="bg-zinc-900/40 rounded-md border border-border/20"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, assignedDateStart: undefined, assignedDateEnd: undefined }))}
              className="mt-4 w-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            >
              Clear Dates
            </Button>
          </PopoverContent>
        </Popover>

        {/* Display Active Date Range */}
        {(filters.assignedDateStart || filters.assignedDateEnd) && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-xs font-medium text-indigo-300 ml-auto">
            {filters.assignedDateStart ? format(filters.assignedDateStart, "MMM d, yyyy") : "Any"}
            <span className="text-indigo-500/50">→</span>
            {filters.assignedDateEnd ? format(filters.assignedDateEnd, "MMM d, yyyy") : "Any"}
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="h-10 text-zinc-400 hover:text-white hover:bg-zinc-900/50 gap-1.5 ml-auto"
          >
            <X className="h-4 w-4" />
            <span className="text-xs font-semibold">Clear Filters</span>
          </Button>
        )}
      </div>
    </div>
  );
}
