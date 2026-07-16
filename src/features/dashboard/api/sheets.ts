import { google } from "googleapis";
import { Issue } from "../types";
import { IssueSchema } from "../schemas";
import { prisma } from "@/lib/prisma";
import { getAccessTokenForUser } from "@/lib/googleAuth";

/**
 * Returns a Google Sheets client authenticated using either the user's OAuth access token
 * or the service account credentials as a fallback.
 */
export async function getSheetsClient(projectId: string, ownerId: string) {
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
export function getColumnLetter(colIndex: number): string {
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
    (m: any) => m.tabName === tabName && m.fieldKey === "issueStatus"
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

/**
 * Detects headers from the Google Sheet and syncs columns and status values in the database.
 */
export async function syncProjectColumnsAndStatuses(projectId: string): Promise<{
  updatedMappingsCount: number;
  newStatusesCount: number;
}> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      sheetConfigs: true,
      columnMappings: true,
      statusConfigs: true,
    },
  });

  if (!project) throw new Error("Project not found");
  const config = project.sheetConfigs[0];
  if (!config) throw new Error("SheetConfig not found");

  const sheets = await getSheetsClient(project.id, project.ownerId);

  let updatedMappingsCount = 0;
  let newStatusesCount = 0;

  const KNOWN_HEADERS: Record<string, string> = {
    "module": "module",
    "module/platform": "module",
    "platform": "module",
    "feature": "feature",
    "feature/sub-module": "feature",
    "issue title": "issueTitle",
    "title": "issueTitle",
    "summary": "issueTitle",
    "issue summary": "issueTitle",
    "issue description": "issueDescription",
    "description": "issueDescription",
    "steps to reproduce": "stepsToReproduce",
    "steps": "stepsToReproduce",
    "resources": "resources",
    "links": "resources",
    "attachments": "resources",
    "issue status": "issueStatus",
    "status": "issueStatus",
    "reported by": "reportedBy",
    "reporter": "reportedBy",
    "dev comments": "devComments",
    "developer comments": "devComments",
    "comments": "devComments",
    "estimation": "estimation",
    "est": "estimation",
    "estimation (hour)": "estimation",
    "estimation (hours)": "estimation",
    "spent time": "spentTime",
    "spent time (hour)": "spentTime",
    "spent time (hours)": "spentTime",
    "actual time": "spentTime",
    "assigned date": "assignedDate",
    "assign date": "assignedDate",
    "assignee": "assignee",
    "assigned to": "assignee",
    "resolution date": "resolutionDate",
    "resolve date": "resolutionDate",
    "resolved date": "resolutionDate",
    "qa comments": "qaComments",
    "tester comments": "qaComments",
  };

  const uniqueStatusesFound = new Set<string>();

  for (const tabName of config.selectedTabs) {
    // 1. Fetch the header row
    const headerRowNumber = config.headerRow;
    const headerRange = `${tabName}!A${headerRowNumber}:Z${headerRowNumber}`;

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.sheetId,
        range: headerRange,
      });

      const headerValues = response.data.values?.[0] || [];

      for (let colIndex = 0; colIndex < headerValues.length; colIndex++) {
        const rawHeader = headerValues[colIndex]?.trim().toLowerCase();
        if (!rawHeader) continue;

        const fieldKey = KNOWN_HEADERS[rawHeader];
        if (fieldKey) {
          // Check if mapping exists and is different
          const existing = project.columnMappings.find(
            (m: any) => m.tabName === tabName && m.fieldKey === fieldKey
          );

          if (!existing) {
            // Create mapping
            await prisma.columnMapping.create({
              data: {
                projectId: project.id,
                tabName,
                fieldKey,
                columnIndex: colIndex,
              },
            });
            updatedMappingsCount++;
          } else if (existing.columnIndex !== colIndex) {
            // Update mapping
            await prisma.columnMapping.update({
              where: { id: existing.id },
              data: { columnIndex: colIndex },
            });
            updatedMappingsCount++;
          }
        }
      }

      // 2. Fetch the entire column for status config auto-sync
      const freshMappings = await prisma.columnMapping.findMany({
        where: { projectId: project.id, tabName },
      });
      const statusMapping = freshMappings.find((m: any) => m.fieldKey === "issueStatus");

      if (statusMapping) {
        const startRow = config.dataStartRow;
        const colLetter = getColumnLetter(statusMapping.columnIndex);
        const statusRange = `${tabName}!${colLetter}${startRow}:${colLetter}`;

        const statusResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: config.sheetId,
          range: statusRange,
        });

        const statusRows = statusResponse.data.values || [];
        for (const row of statusRows) {
          const val = row[0]?.trim();
          if (val && val !== "-" && val !== "") {
            uniqueStatusesFound.add(val);
          }
        }
      }
    } catch (err) {
      console.error(`[sheets] Failed to sync headers/statuses for tab "${tabName}":`, err);
    }
  }

  // 3. Upsert missing status configs
  for (const statusVal of Array.from(uniqueStatusesFound)) {
    const existingStatus = project.statusConfigs.find(
      (s: any) => s.statusValue.toLowerCase() === statusVal.toLowerCase()
    );

    if (!existingStatus) {
      // Set category by fuzzy values
      let category: "open" | "closed" | "fixed" | "qa" | "other" = "other";
      const normalized = statusVal.toLowerCase();
      if (normalized.includes("todo") || normalized.includes("progress")) {
        category = "open";
      } else if (normalized.includes("resolve") || normalized.includes("close") || normalized.includes("done")) {
        category = "closed";
      } else if (normalized.includes("fix") || normalized.includes("deploy")) {
        category = "fixed";
      } else if (normalized.includes("qa") || normalized.includes("test")) {
        category = "qa";
      }

      await prisma.statusConfig.create({
        data: {
          projectId: project.id,
          statusValue: statusVal,
          displayLabel: statusVal.toUpperCase(),
          color: "#4b5563", // Default Slate/Grey
          category,
          sortOrder: project.statusConfigs.length + newStatusesCount,
        },
      });
      newStatusesCount++;
    }
  }

  return { updatedMappingsCount, newStatusesCount };
}

/**
 * Fetches configuration validation rules from the settings tab in Google Sheets.
 */
export async function fetchValidationRules(
  projectId: string,
  ownerId: string,
  sheetUrl: string,
  validationTabName: string
): Promise<Record<string, string[]>> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    throw new Error("Invalid Google Sheet URL");
  }
  const sheetId = match[1];

  const sheets = await getSheetsClient(projectId, ownerId);
  const range = `${validationTabName}!A1:Z100`;
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return {};

    const headers = rows[0] || [];
    const rulesMap: Record<string, string[]> = {};

    const FIELD_MAPPINGS: Record<string, string> = {
      "reported by": "reportedBy",
      "reporter": "reportedBy",
      "assignee": "assignee",
      "assigned to": "assignee",
      "tested by": "testedBy",
      "tester": "testedBy",
      "module": "module",
      "feature": "feature",
    };

    const colMappings: { fieldKey: string; colIndex: number }[] = [];
    for (let c = 0; c < headers.length; c++) {
      const rawHeader = headers[c]?.trim().toLowerCase();
      if (!rawHeader) continue;
      const fieldKey = FIELD_MAPPINGS[rawHeader];
      if (fieldKey) {
        colMappings.push({ fieldKey, colIndex: c });
        rulesMap[fieldKey] = [];
      }
    }

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      colMappings.forEach(({ fieldKey, colIndex }) => {
        const val = row[colIndex]?.trim();
        if (val && val !== "") {
          rulesMap[fieldKey].push(val);
        }
      });
    }

    return rulesMap;
  } catch (error) {
    console.error(`[sheets] Failed to fetch validation rules from tab "${validationTabName}":`, error);
    return {};
  }
}

/**
 * Scans the first 25 rows of a tab to detect the header row containing "issue title".
 */
export async function detectHeaderRow(
  projectId: string,
  ownerId: string,
  sheetUrl: string,
  tabName: string
): Promise<{ headerRow: number; dataStartRow: number } | null> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    return null;
  }
  const sheetId = match[1];

  try {
    const sheets = await getSheetsClient(projectId, ownerId);
    const range = `${tabName}!A1:Z25`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values || [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || [];
      const hasIssueTitle = row.some((cell) => {
        const val = String(cell).toLowerCase().trim();
        return val === "issue title" || val === "issue_title" || val === "title" || val.includes("issue title");
      });

      if (hasIssueTitle) {
        const header = i + 1;
        return {
          headerRow: header,
          dataStartRow: header + 1,
        };
      }
    }
  } catch (error) {
    console.error(`[sheets] Failed to detect header row on tab "${tabName}":`, error);
  }

  return null;
}

/**
 * Fetches all tab names for a spreadsheet.
 */
export async function getSpreadsheetTabNames(projectId: string, ownerId: string, sheetUrl: string): Promise<string[]> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    throw new Error("Invalid Google Sheet URL");
  }
  const sheetId = match[1];

  const sheets = await getSheetsClient(projectId, ownerId);
  const response = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });

  const sheetsList = response.data.sheets || [];
  return sheetsList
    .map((s) => s.properties?.title)
    .filter((title): title is string => !!title);
}

/**
 * Append a new issue row to Google Sheets based on configured mappings.
 */
export async function createIssueInSheet({
  projectId,
  tabName,
  issueData,
}: {
  projectId: string;
  tabName: string;
  issueData: Record<string, any>;
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

  const mappings = project.columnMappings.filter((m: any) => m.tabName === tabName);
  if (mappings.length === 0) throw new Error(`No column mappings found for tab "${tabName}"`);

  const sheets = await getSheetsClient(project.id, project.ownerId);

  // Find max mapped index to dimension the row array
  const maxIndex = Math.max(...mappings.map((m: any) => m.columnIndex));
  const newRow = Array(maxIndex + 1).fill("");

  // Place form values at their mapped index positions
  mappings.forEach((mapping: any) => {
    const val = issueData[mapping.fieldKey];
    if (val !== undefined && val !== null) {
      newRow[mapping.columnIndex] = Array.isArray(val) ? val.join(", ") : String(val);
    }
  });

  const range = `${tabName}!A:${getColumnLetter(maxIndex)}`;

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow],
      },
    });
    return true;
  } catch (error) {
    console.error(`[sheets] Failed to append issue in Google Sheets:`, error);
    return false;
  }
}

/**
 * Edit an existing issue row in Google Sheets, preserving unmapped columns.
 */
export async function editIssueInSheet({
  projectId,
  tabName,
  sheetRowIndex,
  issueData,
}: {
  projectId: string;
  tabName: string;
  sheetRowIndex: number;
  issueData: Record<string, any>;
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

  const mappings = project.columnMappings.filter((m: any) => m.tabName === tabName);
  if (mappings.length === 0) throw new Error(`No column mappings found for tab "${tabName}"`);

  const sheets = await getSheetsClient(project.id, project.ownerId);

  const maxIndex = Math.max(...mappings.map((m: any) => m.columnIndex));
  const maxColLetter = getColumnLetter(maxIndex);
  const range = `${tabName}!A${sheetRowIndex}:${maxColLetter}${sheetRowIndex}`;

  // Fetch the existing row first to preserve any unmapped/custom cells
  let existingRow: any[] = [];
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.sheetId,
      range,
    });
    existingRow = response.data.values?.[0] || [];
  } catch (err) {
    console.error(`[sheets] Failed to fetch existing row ${sheetRowIndex} for edit:`, err);
  }

  // Create copy and pad with empty strings if smaller than maxIndex
  const updatedRow = [...existingRow];
  while (updatedRow.length <= maxIndex) {
    updatedRow.push("");
  }

  // Overwrite mapped columns with new issue form data
  mappings.forEach((mapping: any) => {
    const val = issueData[mapping.fieldKey];
    if (val !== undefined && val !== null) {
      updatedRow[mapping.columnIndex] = Array.isArray(val) ? val.join(", ") : String(val);
    }
  });

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [updatedRow],
      },
    });
    return true;
  } catch (error) {
    console.error(`[sheets] Failed to update issue in Google Sheets:`, error);
    return false;
  }
}

/**
 * Fetches the raw rows of the validation tab (all columns, all rows including header).
 */
export async function fetchValidationTabRaw({
  projectId,
  ownerId,
  sheetUrl,
  validationTabName,
}: {
  projectId: string;
  ownerId: string;
  sheetUrl: string;
  validationTabName: string;
}): Promise<string[][]> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) throw new Error("Invalid Google Sheet URL");
  const sheetId = match[1];
  const sheets = await getSheetsClient(projectId, ownerId);
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${validationTabName}!A1:Z500`,
    });
    return (response.data.values || []).map((row) =>
      row.map((cell) => (cell == null ? "" : String(cell)))
    );
  } catch (err) {
    console.error(`[sheets] Failed to fetch validation tab raw:`, err);
    return [];
  }
}

/**
 * Overwrites the entire validation tab with a new set of rows.
 */
export async function writeValidationTab({
  projectId,
  ownerId,
  sheetUrl,
  validationTabName,
  rows,
}: {
  projectId: string;
  ownerId: string;
  sheetUrl: string;
  validationTabName: string;
  rows: string[][];
}): Promise<boolean> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) throw new Error("Invalid Google Sheet URL");
  const sheetId = match[1];
  const sheets = await getSheetsClient(projectId, ownerId);
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const endCol = getColumnLetter(Math.max(maxCols - 1, 0));
  const range = `${validationTabName}!A1:${endCol}${rows.length + 1}`;
  try {
    // Clear first, then write
    await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range });
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${validationTabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: rows },
    });
    return true;
  } catch (err) {
    console.error(`[sheets] Failed to write validation tab:`, err);
    return false;
  }
}

/**
 * Appends a value to a specific column in the validation tab, identified by its header name.
 */
export async function appendValueToValidationColumn({
  projectId,
  ownerId,
  sheetUrl,
  validationTabName,
  columnHeader,
  value,
}: {
  projectId: string;
  ownerId: string;
  sheetUrl: string;
  validationTabName: string;
  columnHeader: string;
  value: string;
}): Promise<boolean> {
  const rows = await fetchValidationTabRaw({ projectId, ownerId, sheetUrl, validationTabName });
  if (rows.length === 0) return false;

  const headers = rows[0];
  const colIndex = headers.findIndex(
    (h) => h.trim().toLowerCase() === columnHeader.trim().toLowerCase()
  );
  if (colIndex === -1) {
    console.warn(`[sheets] Column "${columnHeader}" not found in validation tab`);
    return false;
  }

  // Find first empty row in that column (starting from row index 1)
  let targetRowIndex = rows.length; // default: append after last row
  for (let r = 1; r < rows.length; r++) {
    const cell = rows[r]?.[colIndex];
    if (!cell || cell.trim() === "") {
      targetRowIndex = r;
      break;
    }
  }

  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match?.[1]) return false;
  const sheetId = match[1];
  const sheets = await getSheetsClient(projectId, ownerId);
  const colLetter = getColumnLetter(colIndex);
  // +1 because Sheets rows are 1-indexed
  const cellRange = `${validationTabName}!${colLetter}${targetRowIndex + 1}`;

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: cellRange,
      valueInputOption: "RAW",
      requestBody: { values: [[value]] },
    });
    return true;
  } catch (err) {
    console.error(`[sheets] Failed to append value to validation column:`, err);
    return false;
  }
}

/**
 * Creates a new tab (sheet) inside the Google Spreadsheet.
 */
export async function createSpreadsheetTab({
  projectId,
  ownerId,
  sheetUrl,
  tabName,
}: {
  projectId: string;
  ownerId: string;
  sheetUrl: string;
  tabName: string;
}): Promise<boolean> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match?.[1]) throw new Error("Invalid Google Sheet URL");
  const sheetId = match[1];
  const sheets = await getSheetsClient(projectId, ownerId);
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
    return true;
  } catch (err: any) {
    console.error(`[sheets] Failed to create tab "${tabName}":`, err);
    throw new Error(err?.errors?.[0]?.message || err?.message || "Failed to create tab");
  }
}

/**
 * Deletes a tab (sheet) from the Google Spreadsheet by name.
 */
export async function deleteSpreadsheetTab({
  projectId,
  ownerId,
  sheetUrl,
  tabName,
}: {
  projectId: string;
  ownerId: string;
  sheetUrl: string;
  tabName: string;
}): Promise<boolean> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match?.[1]) throw new Error("Invalid Google Sheet URL");
  const sheetId = match[1];
  const sheets = await getSheetsClient(projectId, ownerId);

  // First get the internal sheetId (numeric) by looking up the tab name
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === tabName);
  if (!sheet?.properties?.sheetId) {
    throw new Error(`Sheet tab "${tabName}" not found`);
  }

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{ deleteSheet: { sheetId: sheet.properties.sheetId } }],
      },
    });
    return true;
  } catch (err: any) {
    console.error(`[sheets] Failed to delete tab "${tabName}":`, err);
    throw new Error(err?.errors?.[0]?.message || err?.message || "Failed to delete tab");
  }
}

/**
 * Returns all sheet tab names for a spreadsheet.
 */
export async function listSpreadsheetTabs({
  projectId,
  ownerId,
  sheetUrl,
}: {
  projectId: string;
  ownerId: string;
  sheetUrl: string;
}): Promise<string[]> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match?.[1]) throw new Error("Invalid Google Sheet URL");
  const sheetId = match[1];
  const sheets = await getSheetsClient(projectId, ownerId);
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    return (meta.data.sheets || [])
      .map((s) => s.properties?.title || "")
      .filter(Boolean);
  } catch (err) {
    console.error(`[sheets] Failed to list tabs:`, err);
    return [];
  }
}
