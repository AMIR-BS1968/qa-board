import { z } from "zod";
import { IssueStatus } from "../types";
import { ISSUE_STATUSES } from "../constants";

// Helper to normalize status casing and value
export const normalizeStatus = (val: unknown): IssueStatus => {
  if (typeof val !== "string") return "TODO";
  const normalized = val.trim().toUpperCase();
  if (ISSUE_STATUSES.includes(normalized as IssueStatus)) {
    return normalized as IssueStatus;
  }
  // Alternate/flexible matches
  if (normalized === "TO DO" || normalized === "TODO") return "TODO";
  if (normalized === "IN-PROGRESS" || normalized === "IN PROGRESS") return "IN PROGRESS";
  if (normalized === "QA" || normalized === "IN QA" || normalized === "IN-QA") return "IN QA";
  if (normalized === "RESOLVED") return "RESOLVED";
  if (normalized === "FIXED") return "FIXED";
  if (normalized === "NOT-RESOLVED" || normalized === "NOT RESOLVED" || normalized === "REJECTED") return "NOT RESOLVED";
  if (normalized === "NOT-NEEDED" || normalized === "NOT NEEDED") return "NOT NEEDED";

  return "TODO"; // default fallback
};

export const IssueSchema = z.object({
  module: z.string().default("General"),
  feature: z.string().default("General"),
  issueTitle: z.string().min(1, "Issue title is required"),
  issueDescription: z.string().default(""),
  stepsToReproduce: z.string().default(""),
  resources: z.string().default(""),
  issueStatus: z.preprocess(normalizeStatus, z.enum([
    "TODO",
    "IN PROGRESS",
    "FIXED",
    "IN QA",
    "RESOLVED",
    "NOT RESOLVED",
    "NOT NEEDED"
  ])),
  reportedBy: z.string().default(""),
  devComments: z.string().default(""),
  estimation: z.string().default(""),
  spentTime: z.string().default(""),
  assignedDate: z.string().default(""),
  assignee: z.string().default("Unassigned"),
  resolutionDate: z.string().default(""),
  qaComments: z.string().default(""),
  sheetSource: z.string().default(""),
  sheetRowIndex: z.number().optional(),
});

export type RawIssueInput = z.input<typeof IssueSchema>;
export type ValidatedIssue = z.output<typeof IssueSchema>;
