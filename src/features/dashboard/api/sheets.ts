import { google } from "googleapis";
import { Issue } from "../types";
import { IssueSchema } from "../schemas";
import { COLUMN_MAP } from "./columnMapping";

/**
 * Fetches issues from a specific named sheet tab using the Google Sheets API v4
 * with service account credentials.
 * Column headers are at row 9; data starts at row 10.
 */
async function fetchFromSheet(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  sheetName: "Admin" | "App"
): Promise<Issue[]> {
  const sheetIssues: Issue[] = [];

  try {
    // Data starts at row 10 (headers at row 9)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A10:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.warn(`[sheets] No data rows found in the "${sheetName}" sheet.`);
      return [];
    }

    for (const row of rows) {
      // Skip completely empty rows
      if (!row || row.every((cell: string) => !cell?.trim())) continue;

      const rawInput = {
        module: row[COLUMN_MAP.module]?.trim() || "General",
        feature: row[COLUMN_MAP.feature]?.trim() || "General",
        issueTitle: row[COLUMN_MAP.issueTitle]?.trim() || "",
        issueDescription: row[COLUMN_MAP.issueDescription]?.trim() || "",
        stepsToReproduce: row[COLUMN_MAP.stepsToReproduce]?.trim() || "",
        resources: row[COLUMN_MAP.resources]?.trim() || "",
        issueStatus: row[COLUMN_MAP.issueStatus]?.trim() || "TODO",
        reportedBy: row[COLUMN_MAP.reportedBy]?.trim() || "",
        devComments: row[COLUMN_MAP.devComments]?.trim() || "",
        estimation: row[COLUMN_MAP.estimation]?.trim() || "",
        spentTime: row[COLUMN_MAP.spentTime]?.trim() || "",
        assignedDate: row[COLUMN_MAP.assignedDate]?.trim() || "",
        assignee: row[COLUMN_MAP.assignee]?.trim() || "Unassigned",
        resolutionDate: row[COLUMN_MAP.resolutionDate]?.trim() || "",
        qaComments: row[COLUMN_MAP.qaComments]?.trim() || "",
        sheetSource: sheetName,
      };

      // Skip rows without a meaningful issue title
      if (!rawInput.issueTitle) continue;

      const parsed = IssueSchema.safeParse(rawInput);
      if (parsed.success) {
        sheetIssues.push(parsed.data);
      } else {
        console.error(
          `[sheets] Schema validation failed for a row in "${sheetName}":`,
          rawInput,
          parsed.error.flatten()
        );
        // Push with raw data as fallback to avoid data loss
        sheetIssues.push(rawInput as unknown as Issue);
      }
    }
  } catch (err) {
    console.error(`[sheets] Failed to fetch from "${sheetName}" sheet:`, err);
  }

  return sheetIssues;
}

/**
 * Main data fetcher.
 * Pulls issues from both Admin and App sheet tabs using a service account.
 * Falls back to mock data if environment variables are missing.
 */
export async function fetchRawIssues(): Promise<Issue[]> {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  // Graceful fallback to Mock Data if env vars are not configured
  if (!clientEmail || !privateKey || !sheetId) {
    console.warn(
      "[sheets] Service account credentials or Sheet ID are missing. Returning empty array."
    );
    return [];
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        // Replace escaped newlines (stored as \n in .env) with actual newlines
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const [adminIssues, appIssues] = await Promise.all([
      fetchFromSheet(sheets, sheetId, "Admin"),
      fetchFromSheet(sheets, sheetId, "App"),
    ]);

    const allIssues = [...adminIssues, ...appIssues];

    if (allIssues.length === 0) {
      console.warn("[sheets] Both sheets returned no data. Returning empty array.");
      return [];
    }

    return allIssues;
  } catch (error) {
    console.error("[sheets] Unexpected error fetching from Google Sheets:", error);
    return [];
  }
}
