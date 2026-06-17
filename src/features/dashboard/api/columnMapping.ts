/**
 * Centralized column mapping for the Google Sheets API.
 * The keys match the Issue schema properties, and the values represent the column indices (0-indexed).
 * 
 * Column Reference:
 * 0 (A): Module
 * 1 (B): Feature
 * 2 (C): Issue Title
 * 3 (D): Issue Description
 * 4 (E): Steps to Reproduce
 * 5 (F): Resources
 * 6 (G): Issue Status
 * 7 (H): Reported By
 * 8 (I): Dev Comments
 * 9 (J): Estimation
 * 10 (K): Spent Time
 * 11 (L): Assigned Date
 * 12 (M): Assignee
 * 13 (N): Resolution Date
 * 14 (O): QA Comments
 */
export const COLUMN_MAP = {
  module: 0,
  feature: 1,
  issueTitle: 2,
  issueDescription: 3,
  stepsToReproduce: 4,
  resources: 5,
  issueStatus: 6,
  reportedBy: 7,
  devComments: 8,
  estimation: 9,
  spentTime: 10,
  assignedDate: 11,
  assignee: 12,
  resolutionDate: 13,
  qaComments: 14,
};

export const startRow = 11;
