"use client";

import { Folder, Check, Info, RefreshCw } from "lucide-react";

interface SheetSetupTabProps {
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  selectedTabs: string[];
  setSelectedTabs: (tabs: string[]) => void;
  tabs: string[];
  isLoadingTabs?: boolean;
  headerRow: number;
  setHeaderRow: (val: number) => void;
  dataStartRow: number;
  setDataStartRow: (val: number) => void;
  validationTabName: string;
  setValidationTabName: (val: string) => void;
}

export function SheetSetupTab({
  sheetUrl,
  setSheetUrl,
  selectedTabs,
  setSelectedTabs,
  tabs = [],
  isLoadingTabs = false,
  headerRow,
  setHeaderRow,
  dataStartRow,
  setDataStartRow,
  validationTabName,
  setValidationTabName,
}: SheetSetupTabProps) {
  const toggleTab = (tab: string) => {
    setSelectedTabs(
      selectedTabs.includes(tab)
        ? selectedTabs.filter((t) => t !== tab)
        : [...selectedTabs, tab]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3 mb-4">
        <Folder className="h-4 w-4 text-blue-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Google Sheets Integration</h3>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Spreadsheet URL</label>
        <input
          type="url"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-800 transition"
          placeholder="https://docs.google.com/spreadsheets/d/..."
        />
        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
          Paste the full browser URL of the Google Sheet. The Spreadsheet ID will be parsed automatically.
        </p>
      </div>

      <div className="space-y-2.5 pt-2">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tracked Tab Names</label>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Select one or more sheet tabs to scan for QA issues.
        </p>
        
        {isLoadingTabs ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-2 bg-zinc-950 border border-zinc-850 rounded-xl">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            <p className="text-[10px] text-zinc-500 font-bold">Fetching spreadsheet tabs...</p>
          </div>
        ) : tabs.length === 0 ? (
          <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-500 italic">
            No tabs detected or loaded from spreadsheet. Verify sheet permissions and url.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tabs.map((tab) => {
              const checked = selectedTabs.includes(tab);
              return (
                <div
                  key={tab}
                  onClick={() => toggleTab(tab)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${
                    checked
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                      : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <span className="truncate mr-2">{tab}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                      checked
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-zinc-700"
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-1.5 pt-2">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Validation/Settings Tab Name</label>
        {isLoadingTabs ? (
          <div className="w-full h-10 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center px-3.5 text-xs text-zinc-500">
            Loading options...
          </div>
        ) : (
          <select
            value={validationTabName}
            onChange={(e) => setValidationTabName(e.target.value)}
            className="w-full h-10 bg-zinc-950 border border-zinc-850 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-zinc-800 transition"
          >
            <option value="">-- No Settings Tab (Fetch dynamically from active issues) --</option>
            {tabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>
        )}
        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
          The name of the tab containing configuration options (e.g. <code>ValidationRules</code>) to populate filter dropdowns.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Header Row</label>
          <input
            type="number"
            value={headerRow}
            onChange={(e) => setHeaderRow(parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-800 transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Data Start Row</label>
          <input
            type="number"
            value={dataStartRow}
            onChange={(e) => setDataStartRow(parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-800 transition"
          />
        </div>
      </div>
    </div>
  );
}
