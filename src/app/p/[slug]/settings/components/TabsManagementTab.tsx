"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCw, Table2 } from "lucide-react";

interface TabsManagementTabProps {
  slug: string;
}

export function TabsManagementTab({ slug }: TabsManagementTabProps) {
  const [tabs, setTabs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingTab, setDeletingTab] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadTabs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/tabs?slug=${slug}`);
      const data = await res.json();
      if (data.success) {
        setTabs(data.tabs || []);
      } else {
        setError(data.error || "Failed to load tabs");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTabs();
  }, [slug]);

  const handleCreate = async () => {
    const name = newTabName.trim();
    if (!name) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, tabName: name }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTabName("");
        await loadTabs();
      } else {
        setError(data.error || "Failed to create tab");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (tabName: string) => {
    setDeletingTab(tabName);
    setError(null);
    try {
      const res = await fetch("/api/settings/tabs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, tabName }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDelete(null);
        await loadTabs();
      } else {
        setError(data.error || "Failed to delete tab");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setDeletingTab(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3">
        <Table2 className="h-4 w-4 text-blue-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Manage Spreadsheet Tabs</h3>
        <button
          type="button"
          onClick={loadTabs}
          disabled={isLoading}
          className="ml-auto text-zinc-500 hover:text-white transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Create New Tab */}
      <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">New Tab Name</label>
          <input
            type="text"
            placeholder="e.g. Sprint 3, QA Log, Client Issues..."
            value={newTabName}
            onChange={(e) => setNewTabName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !newTabName.trim()}
          className="h-8 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4 rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isCreating ? "Creating..." : "Create Tab"}</span>
        </button>
      </div>

      {/* Tabs List */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          Spreadsheet Tabs ({tabs.length})
        </label>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-zinc-900/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tabs.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-xs text-zinc-600 border border-dashed border-zinc-900 rounded-xl">
            No tabs found — check your sheet URL in Sheet Setup.
          </div>
        ) : (
          <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
            {tabs.map((tab) => (
              <div key={tab} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Table2 className="h-3.5 w-3.5 text-zinc-600" />
                  <span className="font-semibold text-white">{tab}</span>
                </div>

                {confirmDelete === tab ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-rose-400 font-semibold">Delete this tab from the spreadsheet?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(tab)}
                      disabled={deletingTab === tab}
                      className="text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg px-2 py-1 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      {deletingTab === tab ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="text-[10px] font-bold text-zinc-500 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(tab)}
                    className="text-zinc-600 hover:text-rose-400 p-1.5 hover:bg-zinc-900/60 rounded-lg transition cursor-pointer"
                    title="Delete tab from spreadsheet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        ⚠️ Deleting a tab will permanently remove it from your Google Spreadsheet. This action cannot be undone.
      </p>
    </div>
  );
}
