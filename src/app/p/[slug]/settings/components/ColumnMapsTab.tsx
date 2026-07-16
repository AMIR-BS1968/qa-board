"use client";

import { useState, useEffect } from "react";
import { Folder, LayoutGrid, ChevronDown, Search, X } from "lucide-react";

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

  // Active tab state
  const [activeMapTab, setActiveMapTab] = useState<string>(() => tabsList[0] || "");
  const [showMoreOpen, setShowMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keep active tab in sync if tabsList changes
  useEffect(() => {
    if (tabsList.length > 0 && (!activeMapTab || !tabsList.includes(activeMapTab))) {
      setActiveMapTab(tabsList[0]);
    }
  }, [tabsList, activeMapTab]);

  const initialTabs = tabsList.slice(0, 5);
  
  // If active tab is not in the first 5, append it to the visible list so it stays highlighted
  const visibleTabs = [...initialTabs];
  if (activeMapTab && !visibleTabs.includes(activeMapTab)) {
    visibleTabs.push(activeMapTab);
  }

  const hasMore = tabsList.length > 5;

  const filteredTabs = tabsList.filter((tab) =>
    tab.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Column Index Mapping</h3>
        </div>
      </div>

      {tabsList.length === 0 ? (
        <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs text-zinc-500 italic">
          No tracked tabs selected. Go to Sheet Setup to enable tracking on tabs first.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top select chips */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-900/40 pb-4">
            {visibleTabs.map((tab) => {
              const isActive = activeMapTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveMapTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                      : "bg-zinc-950 border border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                  }`}
                >
                  {tab}
                </button>
              );
            })}

            {hasMore && (
              <button
                type="button"
                onClick={() => setShowMoreOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer active:scale-[0.98] bg-zinc-900/40 border border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center gap-1"
              >
                <span>More Tabs</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Tab mappings form */}
          {activeMapTab && (
            <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-1.5 border-b border-zinc-900/40 pb-3">
                <Folder className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wide">
                  Mapping Columns for Tab: <span className="text-blue-400 font-mono">{activeMapTab}</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fieldKeys.map((fk) => {
                  const mappingsForTab = columnMappings[activeMapTab] || {};
                  const value = mappingsForTab[fk.key] !== undefined ? mappingsForTab[fk.key] : -1;

                  return (
                    <div key={fk.key} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center justify-between">
                        <span>{fk.label}</span>
                      </label>
                      <select
                        value={value}
                        onChange={(e) =>
                          handleColumnIndexChange(activeMapTab, fk.key, parseInt(e.target.value))
                        }
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-800 transition cursor-pointer"
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
          )}
        </div>
      )}

      {/* Show More Modal dialog */}
      {showMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20">
              <span className="text-xs font-black text-white uppercase tracking-wider">Select Tracked Tab</span>
              <button
                type="button"
                onClick={() => {
                  setShowMoreOpen(false);
                  setSearchQuery("");
                }}
                className="text-zinc-500 hover:text-white transition p-1 hover:bg-zinc-900 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search filter */}
            <div className="p-3 border-b border-zinc-900/60 bg-zinc-950">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search tab names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-800 transition"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-900/40">
              {filteredTabs.length === 0 ? (
                <p className="text-xs text-zinc-600 italic text-center py-6">No matching tabs found</p>
              ) : (
                filteredTabs.map((tab) => {
                  const isActive = activeMapTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveMapTab(tab);
                        setShowMoreOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                        isActive
                          ? "bg-blue-500/10 text-blue-400 font-extrabold"
                          : "text-zinc-400 hover:bg-zinc-900/40 hover:text-white"
                      }`}
                    >
                      <span>{tab}</span>
                      {isActive && <span className="text-[10px] uppercase font-mono tracking-wider">Active</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
