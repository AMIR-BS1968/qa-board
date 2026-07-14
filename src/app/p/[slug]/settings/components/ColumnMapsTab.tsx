"use client";

import { Folder, LayoutGrid } from "lucide-react";

interface FieldKey {
  key: string;
  label: string;
  description: string;
}

interface ColumnMapsTabProps {
  tabsList: string[];
  fieldKeys: FieldKey[];
  columnMappings: Record<string, Record<string, number>>;
  handleColumnIndexChange: (tab: string, fieldKey: string, val: number) => void;
}

export function ColumnMapsTab({
  tabsList,
  fieldKeys,
  columnMappings,
  handleColumnIndexChange,
}: ColumnMapsTabProps) {
  const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A-Z

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3">
        <LayoutGrid className="h-4 w-4 text-blue-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Column Index Mapping</h3>
      </div>

      <div className="space-y-6">
        {tabsList.map((tab) => (
          <div key={tab} className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-900/40 pb-2">
              <Folder className="w-3.5 h-3.5 text-blue-400" />
              <h4 className="text-xs font-extrabold text-white">Tab: {tab}</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fieldKeys.map((fk) => {
                const mappingsForTab = columnMappings[tab] || {};
                const value = mappingsForTab[fk.key] !== undefined ? mappingsForTab[fk.key] : -1;

                return (
                  <div key={fk.key} className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center justify-between">
                      <span>{fk.label}</span>
                    </label>
                    <select
                      value={value}
                      onChange={(e) =>
                        handleColumnIndexChange(tab, fk.key, parseInt(e.target.value))
                      }
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-800 transition cursor-pointer"
                    >
                      <option value="-1">Not Mapped (Disabled)</option>
                      {letters.map((char, index) => (
                        <option key={char} value={index}>
                          Column {char} (Index {index})
                        </option>
                      ))}
                    </select>
                    <span className="text-[9px] text-zinc-500 block leading-tight px-1">
                      {fk.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
