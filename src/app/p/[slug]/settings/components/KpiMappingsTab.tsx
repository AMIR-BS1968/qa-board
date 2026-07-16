"use client";

import { LayoutGrid, Check } from "lucide-react";
import { StatusConfig } from "../types";

interface KpiMappingsTabProps {
  statuses: StatusConfig[];
  setStatuses: React.Dispatch<React.SetStateAction<StatusConfig[]>>;
}

export function KpiMappingsTab({ statuses, setStatuses }: KpiMappingsTabProps) {
  const kpiCards = [
    { key: "open", label: "Open Issues KPI", description: "Statuses that represent active/open work (e.g. TODO, IN PROGRESS)." },
    { key: "qa", label: "In QA KPI", description: "Statuses that represent testing/QA bottleneck (e.g. IN QA)." },
    { key: "fixed", label: "Fixed & Deployed KPI", description: "Statuses that represent work that is fixed or deployed (e.g. FIXED)." },
    { key: "closed", label: "Resolved Issues KPI", description: "Statuses that represent fully closed/resolved work (e.g. RESOLVED)." },
  ];

  const handleToggleMapping = (statusValue: string, category: "open" | "closed" | "fixed" | "qa" | "other") => {
    setStatuses((prev) =>
      prev.map((s) => {
        if (s.statusValue === statusValue) {
          // If already mapped to this category, unmap it (set to 'other')
          // Otherwise, map it to this category
          const nextCat = s.category === category ? "other" : category;
          return { ...s, category: nextCat };
        }
        return s;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3">
        <LayoutGrid className="h-4 w-4 text-blue-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">KPI Status Mappings</h3>
      </div>

      <p className="text-xs text-zinc-500">
        Configure which spreadsheet status values map to which dashboard KPI cards. A status can belong to one KPI card at a time.
      </p>

      <div className="space-y-6">
        {kpiCards.map((card) => {
          return (
            <div key={card.key} className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">{card.label}</h4>
                <p className="text-xs text-zinc-500 mt-1">{card.description}</p>
              </div>

              {statuses.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">No statuses configured yet. Go to Status Badges to add some.</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {statuses.map((status) => {
                    const isMapped = status.category === card.key;
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => handleToggleMapping(status.statusValue, card.key as any)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 active:scale-[0.98] cursor-pointer ${
                          isMapped
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                            : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-850 hover:text-zinc-200"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: status.color }}
                        />
                        <span>{status.displayLabel}</span>
                        {isMapped && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
