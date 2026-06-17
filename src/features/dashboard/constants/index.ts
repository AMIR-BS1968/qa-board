import { IssueStatus } from "../types";

export const ISSUE_STATUSES: IssueStatus[] = [
  "TODO",
  "IN PROGRESS",
  "FIXED",
  "IN QA",
  "RESOLVED",
  "NOT RESOLVED",
  "NOT NEEDED"
];

export interface StatusMeta {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  chartColor: string;
}

export const STATUS_META_MAP: Record<IssueStatus, StatusMeta> = {
  "TODO": {
    label: "Todo",
    bgClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    textClass: "text-slate-400",
    borderClass: "border-slate-500/20",
    chartColor: "#64748b",
  },
  "IN PROGRESS": {
    label: "In Progress",
    bgClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    textClass: "text-sky-400",
    borderClass: "border-sky-500/20",
    chartColor: "#0ea5e9",
  },
  "FIXED": {
    label: "Fixed",
    bgClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/20",
    chartColor: "#a855f7",
  },
  "IN QA": {
    label: "In QA",
    bgClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/20",
    chartColor: "#f59e0b",
  },
  "RESOLVED": {
    label: "Resolved",
    bgClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/20",
    chartColor: "#10b981",
  },
  "NOT RESOLVED": {
    label: "Not Resolved",
    bgClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/20",
    chartColor: "#f43f5e",
  },
  "NOT NEEDED": {
    label: "Not Needed",
    bgClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/20",
    chartColor: "#3c010bff",
  },
};
