import { google } from "googleapis";
import { Issue } from "../types";
import { IssueSchema } from "../schemas";
import { prisma } from "@/lib/prisma";
import { getAccessTokenForUser } from "@/lib/googleAuth";

/**
 * Returns a Google Sheets client authenticated using either the user's OAuth access token
 * or the service account credentials as a fallback.
 */
async function getSheetsClient(projectId: string, ownerId: string) {
  try {
    const token = await getAccessTokenForUser(ownerId);
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });
    return google.sheets({ version: "v4", auth });
  } catch (error) {
    console.warn(`[sheets] No OAuth token for owner ${ownerId}. Trying Service Account fallback.`);
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (clientEmail && privateKey) {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      return google.sheets({ version: "v4", auth });
    }
    throw new Error("No Google Sheets authentication available (OAuth or Service Account)");
  }
}

/**
 * Converts a 0-based column index to spreadsheet A1 column letter (e.g. 0 -> A, 25 -> Z, 26 -> AA).
 */
function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = "";
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Fetches issues for a specific project.
 */
export async function fetchRawIssuesForProject(projectId: string): Promise<Issue[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      sheetConfigs: true,
      columnMappings: true,
    },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const config = project.sheetConfigs[0];
  if (!config) {
    console.warn(`[sheets] No SheetConfig found for project ${projectId}.`);
    return [];
  }

  const mappings = project.columnMappings;
  if (mappings.length === 0) {
    console.warn(`[sheets] No ColumnMappings found for project ${projectId}.`);
    return [];
  }

  const sheets = await getSheetsClient(project.id, project.ownerId);
  const allIssues: Issue[] = [];

  // Group mappings by tab name
  const mappingsByTab: Record<string, Record<string, number>> = {};
  for (const mapping of mappings) {
    if (!mappingsByTab[mapping.tabName]) {
      mappingsByTab[mapping.tabName] = {};
    }
    mappingsByTab[mapping.tabName][mapping.fieldKey] = mapping.columnIndex;
  }

  for (const tabName of config.selectedTabs) {
    const tabMappings = mappingsByTab[tabName];
    if (!tabMappings) {
      console.warn(`[sheets] No column mappings configured for tab "${tabName}". Skipping.`);
      continue;
    }

    if (tabMappings.issueStatus === undefined) {
      console.warn(`[sheets] issueStatus is not mapped for tab "${tabName}". Skipping tab.`);
      continue;
    }

    try {
      const startRow = config.dataStartRow;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.sheetId,
        range: `${tabName}!A${startRow}:Z`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.warn(`[sheets] No data rows found in tab "${tabName}".`);
        continue;
      }

      let rowIndex = 0;
      for (const row of rows) {
        // sheetRowIndex in Google Sheets is 1-based, and matches startRow + rowIndex
        const sheetRowIndex = startRow + rowIndex;
        rowIndex++;

        // Skip completely empty rows
        if (!row || row.every((cell: string) => !cell?.trim())) continue;

        const rawStatus = row[tabMappings.issueStatus]?.trim();
        if (!rawStatus) continue;

        const rawInput: Record<string, any> = {
          sheetSource: tabName,
          sheetRowIndex: sheetRowIndex,
        };

        for (const [fieldKey, colIdx] of Object.entries(tabMappings)) {
          rawInput[fieldKey] = row[colIdx]?.trim() || "";
        }

        // Apply defaults for fields that are missing/unmapped
        if (!rawInput.module) rawInput.module = "General";
        if (!rawInput.feature) rawInput.feature = "General";
        if (!rawInput.assignee) rawInput.assignee = "Unassigned";

        // Skip rows without a meaningful issue title
        if (!rawInput.issueTitle) continue;

        const parsed = IssueSchema.safeParse(rawInput);
        if (parsed.success) {
          allIssues.push(parsed.data);
        } else {
          console.error(
            `[sheets] Schema validation failed for a row in "${tabName}":`,
            rawInput,
            parsed.error.flatten()
          );
          allIssues.push(rawInput as unknown as Issue);
        }
      }
    } catch (err) {
      console.error(`[sheets] Failed to fetch from tab "${tabName}":`, err);
    }
  }

  return allIssues;
}

/**
 * Fetches issues for a specific project based on its slug.
 */
export async function fetchRawIssuesForProjectSlug(slug: string): Promise<Issue[]> {
  const project = await prisma.project.findUnique({
    where: { slug },
  });
  if (!project) {
    throw new Error(`Project not found with slug: ${slug}`);
  }
  return fetchRawIssuesForProject(project.id);
}

/**
 * Legacy data fetcher for backwards compatibility. Queries the "default" project.
 */
export async function fetchRawIssues(): Promise<Issue[]> {
  try {
    return await fetchRawIssuesForProjectSlug("default");
  } catch (error) {
    console.error("[sheets] Failed to fetch raw issues for default project:", error);
    return [];
  }
}

/**
 * Write back function: updates the status cell in Google Sheets for a specific issue.
 */
export async function updateIssueStatusInSheet({
  projectId,
  tabName,
  sheetRowIndex,
  newStatus,
}: {
  projectId: string;
  tabName: string;
  sheetRowIndex: number;
  newStatus: string;
}): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      sheetConfigs: true,
      columnMappings: true,
    },
  });

  if (!project) throw new Error("Project not found");
  const config = project.sheetConfigs[0];
  if (!config) throw new Error("SheetConfig not found");

  const mapping = project.columnMappings.find(
    (m) => m.tabName === tabName && m.fieldKey === "issueStatus"
  );
  if (!mapping) throw new Error(`issueStatus column not mapped for tab "${tabName}"`);

  const sheets = await getSheetsClient(project.id, project.ownerId);

  const colLetter = getColumnLetter(mapping.columnIndex);
  const range = `${tabName}!${colLetter}${sheetRowIndex}`;

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.sheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [[newStatus]],
      },
    });
    return true;
  } catch (error) {
    console.error(`[sheets] Failed to update issue status in Google Sheets:`, error);
    return false;
  }
}
