"use client";

import { StatusConfig, Issue } from "../types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  column: StatusConfig;
  issues: Issue[];
  updatingItemId: string | null;
  onDragStart: (e: React.DragEvent, issue: Issue) => void;
  onDrop: (e: React.DragEvent, targetStatus: string) => void;
}

export function KanbanColumn({
  column,
  issues,
  updatingItemId,
  onDragStart,
  onDrop,
}: KanbanColumnProps) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, column.statusValue)}
      className="w-72 flex-shrink-0 bg-zinc-900/10 border border-zinc-900 rounded-2xl flex flex-col max-h-[700px] overflow-hidden"
    >
      {/* Column Title */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-900/60 bg-zinc-900/5">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {column.displayLabel}
          </h3>
        </div>
        <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900/80 px-2 py-0.5 rounded-full">
          {issues.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="p-3 overflow-y-auto space-y-2.5 flex-1 min-h-[250px]">
        {issues.length === 0 ? (
          <div className="py-12 text-center text-[10px] text-zinc-700 font-semibold uppercase tracking-wider">
            Empty Column
          </div>
        ) : (
          issues.map((issue) => {
            const isUpdating = updatingItemId === `${issue.sheetSource}-${issue.sheetRowIndex}`;
            return (
              <KanbanCard
                key={`${issue.sheetSource}-${issue.sheetRowIndex}`}
                issue={issue}
                isUpdating={isUpdating}
                onDragStart={onDragStart}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
