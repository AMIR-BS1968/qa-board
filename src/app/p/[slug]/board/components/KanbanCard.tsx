"use client";

import { User, Clock, RefreshCw, ExternalLink } from "lucide-react";
import { Issue } from "../types";

interface KanbanCardProps {
  issue: Issue;
  isUpdating: boolean;
  onDragStart: (e: React.DragEvent, issue: Issue) => void;
  onDetailsClick?: (issue: Issue) => void;
}

export function KanbanCard({ issue, isUpdating, onDragStart, onDetailsClick }: KanbanCardProps) {
  return (
    <div
      draggable={!isUpdating}
      onDragStart={(e) => onDragStart(e, issue)}
      className={`group bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-xl p-3.5 shadow-sm active:scale-[0.98] active:border-zinc-800 transition duration-150 cursor-grab relative overflow-hidden ${
        isUpdating ? "opacity-40 pointer-events-none cursor-wait" : ""
      }`}
    >
      {/* Inner Cell Sync Loading Ring */}
      {isUpdating && (
        <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center z-10">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          {issue.module || "General"}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold text-zinc-500 font-mono">
            Row {issue.sheetRowIndex}
          </span>
          {/* Details button — only visible on hover */}
          {onDetailsClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDetailsClick(issue);
              }}
              title="View / Edit Details"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-zinc-500 hover:text-blue-400 rounded cursor-pointer"
            >
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition leading-relaxed mb-3">
        {issue.issueTitle}
      </h4>

      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-900/60">
        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
          <User className="h-3 w-3 text-zinc-600" />
          <span className="truncate max-w-[100px]">{issue.assignee || "Unassigned"}</span>
        </div>
        
        {issue.estimation && (
          <div className="flex items-center gap-0.5 text-[9px] text-zinc-500 font-mono font-medium">
            <Clock className="h-2.5 w-2.5" />
            <span>{issue.estimation}h</span>
          </div>
        )}
      </div>
    </div>
  );
}
