import { Issue } from "@/features/dashboard/types";

export interface PendingChange {
  id: string; // unique ID
  type: "ISSUE_CREATE" | "ISSUE_UPDATE" | "VALIDATION_UPDATE" | "STATUS_SYNC";
  tabName?: string;
  sheetRowIndex?: number | string; // numeric index or temporary e.g. "pending-..."
  newData?: any;
  prevData?: any;
  description: string;
}

// Read pending changes from localStorage
export function getPendingChanges(slug: string): PendingChange[] {
  if (typeof window === "undefined") return [];
  const key = `pending-changes-${slug}`;
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save pending changes list to localStorage
export function savePendingChanges(slug: string, changes: PendingChange[]): void {
  if (typeof window === "undefined") return;
  const key = `pending-changes-${slug}`;
  if (changes.length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(changes));
  }
  // Notify layout FAB and other hooks/components to re-evaluate their state
  window.dispatchEvent(new CustomEvent("pending-changes-updated"));
}

// Clear all pending changes
export function clearPendingChanges(slug: string): void {
  savePendingChanges(slug, []);
}

// Add or merge a pending change in the queue
export function addPendingChange(slug: string, change: Omit<PendingChange, "id">): void {
  const current = getPendingChanges(slug);

  if (change.type === "ISSUE_UPDATE") {
    // Find if we are updating a newly created issue that is still pending
    const isNewPending = typeof change.sheetRowIndex === "string" && change.sheetRowIndex.startsWith("pending-");
    if (isNewPending) {
      // Merge directly into the ISSUE_CREATE action
      const createIdx = current.findIndex(
        (c) => c.type === "ISSUE_CREATE" && c.sheetRowIndex === change.sheetRowIndex
      );
      if (createIdx !== -1) {
        current[createIdx].newData = {
          ...current[createIdx].newData,
          ...change.newData,
        };
        // Update description with the latest title if it changed
        const title = change.newData.issueTitle || current[createIdx].newData.issueTitle || "Unnamed Issue";
        current[createIdx].description = `Create issue "${title}" in tab "${change.tabName}"`;
        savePendingChanges(slug, current);
        return;
      }
    }

    // Otherwise, check for existing update to the same row/tab
    const idx = current.findIndex(
      (c) =>
        c.type === "ISSUE_UPDATE" &&
        c.tabName === change.tabName &&
        c.sheetRowIndex === change.sheetRowIndex
    );
    if (idx !== -1) {
      // Merge newData. For prevData, keep the original values (don't overwrite them with current intermediates)
      const existing = current[idx];
      const mergedNewData = {
        ...existing.newData,
        ...change.newData,
      };

      // Check if we reverted everything back to the original database/sheet state
      const isRevertedToOriginal = Object.keys(mergedNewData).every((key) => {
        return mergedNewData[key] === existing.prevData[key];
      });

      if (isRevertedToOriginal) {
        // Remove this change since it is no longer different from the original sheet data
        current.splice(idx, 1);
      } else {
        existing.newData = mergedNewData;
        // Merge prevData fields that weren't tracked yet
        existing.prevData = {
          ...change.prevData,
          ...existing.prevData,
        };
        current[idx] = existing;
      }
      savePendingChanges(slug, current);
      return;
    }
  } else if (change.type === "VALIDATION_UPDATE") {
    // Overwrite previous validation update
    const idx = current.findIndex((c) => c.type === "VALIDATION_UPDATE");
    const item: PendingChange = {
      id: `validation-update`,
      ...change,
    };
    if (idx !== -1) {
      current[idx] = item;
    } else {
      current.push(item);
    }
    savePendingChanges(slug, current);
    return;
  } else if (change.type === "STATUS_SYNC") {
    // Check if duplicate status sync
    const idx = current.findIndex(
      (c) => c.type === "STATUS_SYNC" && c.newData?.statusValue === change.newData?.statusValue
    );
    if (idx !== -1) {
      return; // Already synced/staged
    }
  }

  // General add
  const item: PendingChange = {
    id: `${change.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...change,
  };
  current.push(item);
  savePendingChanges(slug, current);
}

// Remove/revert an individual change from the queue
export function revertPendingChange(slug: string, id: string): void {
  const current = getPendingChanges(slug);
  const updated = current.filter((c) => c.id !== id);
  savePendingChanges(slug, updated);
}

// Apply local pending changes on top of loaded issues
export function applyPendingChanges(issues: Issue[], slug: string): Issue[] {
  const changes = getPendingChanges(slug);
  if (changes.length === 0) return issues;

  let updated = [...issues];

  // 1. Apply Issue Updates
  changes.forEach((change) => {
    if (change.type === "ISSUE_UPDATE") {
      updated = updated.map((issue) => {
        if (issue.sheetSource === change.tabName && issue.sheetRowIndex === change.sheetRowIndex) {
          return { ...issue, ...change.newData };
        }
        return issue;
      });
    }
  });

  // 2. Apply Issue Creates
  changes.forEach((change) => {
    if (change.type === "ISSUE_CREATE") {
      const exists = updated.some(
        (issue) =>
          issue.sheetSource === change.tabName && issue.sheetRowIndex === change.sheetRowIndex
      );
      if (!exists) {
        updated.push({
          module: "General",
          feature: "",
          issueTitle: "New Issue",
          issueDescription: "",
          stepsToReproduce: "",
          resources: "",
          issueStatus: "TODO",
          reportedBy: "",
          devComments: "",
          estimation: "",
          spentTime: "",
          assignedDate: "",
          assignee: "Unassigned",
          resolutionDate: "",
          qaComments: "",
          sheetSource: change.tabName || "App",
          ...change.newData,
          sheetRowIndex: change.sheetRowIndex as any, // "pending-..."
        });
      }
    }
  });

  return updated;
}

// Apply pending validation rule changes on top of validationRules record
export function applyPendingValidationRules(
  rules: Record<string, string[]>,
  slug: string
): Record<string, string[]> {
  const changes = getPendingChanges(slug);
  const valChange = changes.find((c) => c.type === "VALIDATION_UPDATE");
  if (!valChange || !valChange.newData || !Array.isArray(valChange.newData.rows)) {
    return rules;
  }

  const rows = valChange.newData.rows as string[][];
  if (rows.length === 0) return {};

  const headers = rows[0] || [];
  const rulesMap: Record<string, string[]> = {};

  const FIELD_MAPPINGS: Record<string, string> = {
    "reported by": "reportedBy",
    "reporter": "reportedBy",
    "assignee": "assignee",
    "assigned to": "assignee",
    "tested by": "testedBy",
    "tester": "testedBy",
    "module": "module",
    "feature": "feature",
  };

  const colMappings: { fieldKey: string; colIndex: number }[] = [];
  for (let c = 0; c < headers.length; c++) {
    const rawHeader = headers[c]?.trim().toLowerCase();
    if (!rawHeader) continue;
    const fieldKey = FIELD_MAPPINGS[rawHeader] || rawHeader;
    colMappings.push({ fieldKey, colIndex: c });
    rulesMap[fieldKey] = [];
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    colMappings.forEach(({ fieldKey, colIndex }) => {
      const val = row[colIndex]?.trim();
      if (val && val !== "") {
        rulesMap[fieldKey].push(val);
      }
    });
  }

  return rulesMap;
}
