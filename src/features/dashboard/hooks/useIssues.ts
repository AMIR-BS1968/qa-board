"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Issue, DashboardMetrics, IssueFilters } from "../types";
import { calculateMetrics } from "../analytics/engine";
import { parseSheetDate } from "@/lib/utils";

export function useIssues(slug: string = "default") {
  const [rawIssues, setRawIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Initialize filters
  const [filters, setFilters] = useState<IssueFilters>({
    search: "",
    source: [],
    module: [],
    status: [],
    assignee: [],
    reportedBy: [],
    assignedDateStart: undefined,
    assignedDateEnd: undefined,
    resolutionDateStart: undefined,
    resolutionDateEnd: undefined,
  });

  // Fetch data from API
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First, sync database configurations from sheet headers and statuses
      await fetch(`/api/sync?slug=${slug}`, { method: "POST" });

      // Then fetch raw issue records using the updated schema
      const res = await fetch(`/api/issues?slug=${slug}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setRawIssues(result.data);
        setLastSynced(new Date());
      } else {
        throw new Error(result.error || "Malformed response from server.");
      }
    } catch (err: unknown) {
      console.error("Hook fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchIssues();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchIssues]);

  // Derive filter options dynamically from raw issues
  const filterOptions = useMemo(() => {
    const modulesSet = new Set<string>();
    const assigneesSet = new Set<string>();
    const reportersSet = new Set<string>();

    rawIssues.forEach((issue) => {
      if (issue.module) modulesSet.add(issue.module);
      if (issue.assignee) assigneesSet.add(issue.assignee);
      if (issue.reportedBy) reportersSet.add(issue.reportedBy);
    });

    return {
      modules: Array.from(modulesSet).sort(),
      assignees: Array.from(assigneesSet).sort(),
      reporters: Array.from(reportersSet).sort(),
    };
  }, [rawIssues]);

  // Compute filtered issues with high performance memoization
  const filteredIssues = useMemo(() => {
    return rawIssues.filter((issue) => {
      // 1. Text Search across Title, Description, Assignee, Module
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const inTitle = issue.issueTitle?.toLowerCase().includes(query);
        const inDesc = issue.issueDescription?.toLowerCase().includes(query);
        const inAssignee = issue.assignee?.toLowerCase().includes(query);
        const inModule = issue.module?.toLowerCase().includes(query);

        if (!inTitle && !inDesc && !inAssignee && !inModule) {
          return false;
        }
      }

      // 2. Source Filter
      if (filters.source.length > 0 && !filters.source.includes(issue.sheetSource)) {
        return false;
      }

      // 3. Module Filter
      if (filters.module.length > 0 && !filters.module.includes(issue.module)) {
        return false;
      }

      // 4. Status Filter
      if (filters.status.length > 0 && !filters.status.includes(issue.issueStatus)) {
        return false;
      }

      // 5. Assignee Filter
      if (filters.assignee.length > 0 && !filters.assignee.includes(issue.assignee)) {
        return false;
      }

      // 5.5. Reported By Filter
      if (filters.reportedBy.length > 0 && !filters.reportedBy.includes(issue.reportedBy)) {
        return false;
      }

      // 6. Assigned Date Filter
      if (filters.assignedDateStart || filters.assignedDateEnd) {
        const d = parseSheetDate(issue.assignedDate);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);

        if (filters.assignedDateStart) {
          const s = new Date(filters.assignedDateStart);
          s.setHours(0, 0, 0, 0);
          if (d < s) return false;
        }
        if (filters.assignedDateEnd) {
          const e = new Date(filters.assignedDateEnd);
          e.setHours(23, 59, 59, 999);
          if (d > e) return false;
        }
      }

      return true;
    });
  }, [rawIssues, filters]);

  // Compute metrics dynamically from the raw issues
  // The global filters should only affect the table, not the KPIs/Charts
  const metrics = useMemo<DashboardMetrics>(() => {
    return calculateMetrics(rawIssues);
  }, [rawIssues]);

  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      source: [],
      module: [],
      status: [],
      assignee: [],
      reportedBy: [],
      assignedDateStart: undefined,
      assignedDateEnd: undefined,
      resolutionDateStart: undefined,
      resolutionDateEnd: undefined,
    });
  }, []);

  return {
    rawIssues,
    filteredIssues,
    metrics,
    filterOptions,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    error,
    lastSynced,
    refetch: fetchIssues,
  };
}
