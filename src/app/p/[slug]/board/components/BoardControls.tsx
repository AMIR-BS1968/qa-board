"use client";

import { LayoutGrid, Search } from "lucide-react";

interface BoardControlsProps {
  projectName: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedAssignee: string;
  setSelectedAssignee: (val: string) => void;
  assignees: string[];
}

export function BoardControls({
  projectName,
  searchQuery,
  setSearchQuery,
  selectedAssignee,
  setSelectedAssignee,
  assignees,
}: BoardControlsProps) {
  return (
    <section className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
          <LayoutGrid className="h-4 w-4 rotate-45 text-blue-500" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            {projectName}
          </h2>
          <p className="text-[11px] text-zinc-500">
            Drag cards between columns to directly update Google Sheets cells.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Search */}
        <div className="relative flex-1 sm:w-60">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
          <input
            type="text"
            placeholder="Search board issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition"
          />
        </div>
        
        {/* Assignee select */}
        <select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="bg-zinc-950 border border-zinc-855 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-800 transition cursor-pointer"
        >
          <option value="all">All Assignees</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
