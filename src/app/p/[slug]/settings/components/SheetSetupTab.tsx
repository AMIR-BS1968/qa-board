"use client";

import { Folder } from "lucide-react";

interface SheetSetupTabProps {
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  tabsStr: string;
  setTabsStr: (tabs: string) => void;
  headerRow: number;
  setHeaderRow: (val: number) => void;
  dataStartRow: number;
  setDataStartRow: (val: number) => void;
}

export function SheetSetupTab({
  sheetUrl,
  setSheetUrl,
  tabsStr,
  setTabsStr,
  headerRow,
  setHeaderRow,
  dataStartRow,
  setDataStartRow,
}: SheetSetupTabProps) {
  return (
    <div className="space-y-4">
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

      <div className="space-y-1.5 pt-2">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tracked Tab Names</label>
        <input
          type="text"
          value={tabsStr}
          onChange={(e) => setTabsStr(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-800 transition"
          placeholder="e.g. Admin, App"
        />
        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
          A comma-separated list of sheet tab names (e.g. <code>Admin, App, Backend</code>) to scan for QA issues.
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
