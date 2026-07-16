"use client";

import { useState, useEffect } from "react";
import { Database, Trash2, X, RefreshCw, Undo2, AlertCircle } from "lucide-react";
import {
  getPendingChanges,
  revertPendingChange,
  clearPendingChanges,
  PendingChange,
} from "@/lib/batchUpdates";

interface BatchUpdateFABContainerProps {
  slug: string;
}

export function BatchUpdateFABContainer({ slug }: BatchUpdateFABContainerProps) {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUpdate = () => {
      setPendingChanges(getPendingChanges(slug));
    };

    window.addEventListener("pending-changes-updated", handleUpdate);
    handleUpdate();

    return () => {
      window.removeEventListener("pending-changes-updated", handleUpdate);
    };
  }, [slug]);

  if (pendingChanges.length === 0) return null;

  const handleDiscardAll = () => {
    if (confirm("Discard all pending local updates? This will restore the current sheet data.")) {
      clearPendingChanges(slug);
      setIsOpen(false);
      // Reload current page to reset all states cleanly
      window.location.reload();
    }
  };

  const handleRevert = (id: string) => {
    revertPendingChange(slug, id);
    const updated = getPendingChanges(slug);
    if (updated.length === 0) {
      setIsOpen(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pendingChanges }),
      });
      const data = await res.json();
      if (data.success) {
        // Clear queue
        clearPendingChanges(slug);
        setIsOpen(false);
        // Force fully reloading to pull fresh records
        window.location.reload();
      } else {
        setError(data.error || "Failed to batch update Google Sheets");
      }
    } catch (err: any) {
      setError(err.message || "Network error occurred during batch sync");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to construct diff tags for display
  const getDiffTags = (change: PendingChange) => {
    const diffs: string[] = [];
    if (change.prevData && change.newData) {
      Object.keys(change.newData).forEach((key) => {
        const oldVal = change.prevData[key] !== undefined ? String(change.prevData[key]) : "";
        const newVal = String(change.newData[key]);
        if (oldVal !== newVal && key !== "sheetSource" && key !== "sheetRowIndex") {
          // Pretty print field key
          const label = key
            .replace("issue", "")
            .replace(/([A-Z])/g, " $1")
            .trim();
          diffs.push(`${label}: "${oldVal || "—"}" ➔ "${newVal || "—"}"`);
        }
      });
    }
    return diffs;
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-500/20 hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer animate-pulse"
        title={`${pendingChanges.length} pending local changes`}
      >
        <Database className="w-6 h-6" />
        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-500 text-black text-xs font-bold rounded-full flex items-center justify-center border border-zinc-950">
          {pendingChanges.length}
        </span>
      </button>

      {/* Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Pending Spreadsheet writes
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description Warning */}
            <div className="flex gap-2.5 items-start bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-amber-500 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                These changes are staged in your browser session. They are reflected on the site
                optimistically but will not write to Google Sheets until you sync them.
              </span>
            </div>

            {/* Staged list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[40vh] pr-1">
              {pendingChanges.map((change) => {
                const diffs = getDiffTags(change);
                return (
                  <div
                    key={change.id}
                    className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-start justify-between gap-4 group hover:bg-zinc-900/60 transition"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-zinc-200">{change.description}</div>
                      {diffs.length > 0 && (
                        <div className="space-y-0.5 pl-2 border-l border-zinc-800 text-[10px] text-zinc-400 font-mono">
                          {diffs.map((diff, dIdx) => (
                            <div key={dIdx}>{diff}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRevert(change.id)}
                      className="text-zinc-500 hover:text-amber-400 p-1.5 hover:bg-zinc-800/40 rounded transition cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95"
                      title="Revert this change"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Revert</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-zinc-900 justify-end">
              <button
                onClick={handleDiscardAll}
                disabled={isUpdating}
                className="px-4 py-2 border border-rose-900/30 bg-rose-950/10 hover:bg-rose-950/20 text-rose-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Discard All</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isUpdating}
                className="px-4 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-bold text-xs rounded-xl transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                Close
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync to Sheet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
