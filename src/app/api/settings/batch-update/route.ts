import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSheetsClient, getColumnLetter } from "@/features/dashboard/api/sheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { slug, pendingChanges } = await request.json();
    if (!slug || !Array.isArray(pendingChanges) || pendingChanges.length === 0) {
      return NextResponse.json({ success: false, error: "Missing slug or pendingChanges list" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        sheetConfigs: true,
        columnMappings: true,
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const config = project.sheetConfigs[0];
    if (!config) {
      return NextResponse.json({ success: false, error: "SheetConfig not found for project" }, { status: 400 });
    }

    const sheets = await getSheetsClient(project.id, project.ownerId);

    // Group changes by type
    const issueCreates = pendingChanges.filter((c) => c.type === "ISSUE_CREATE");
    const issueUpdates = pendingChanges.filter((c) => c.type === "ISSUE_UPDATE");
    const validationUpdate = pendingChanges.find((c) => c.type === "VALIDATION_UPDATE");
    const statusSyncs = pendingChanges.filter((c) => c.type === "STATUS_SYNC");

    // 1. Process Validation Grid Update
    if (validationUpdate && config.validationTabName) {
      const rows = validationUpdate.newData.rows as string[][];
      const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
      const endCol = getColumnLetter(Math.max(maxCols - 1, 0));
      const range = `${config.validationTabName}!A1:${endCol}${rows.length + 1}`;

      await sheets.spreadsheets.values.clear({
        spreadsheetId: config.sheetId,
        range,
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: config.sheetId,
        range: `${config.validationTabName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
    }

    // 2. Process Status Badge Syncs
    for (const sync of statusSyncs) {
      const statusValue = sync.newData?.statusValue;
      if (!statusValue || !config.validationTabName) continue;

      // Read validation tab rows
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.sheetId,
        range: `${config.validationTabName}!A1:Z500`,
      });
      const rows = response.data.values || [];
      if (rows.length === 0) continue;

      const headers = rows[0] || [];
      // Fuzzy match status header
      const statusHeaders = ["status", "issue status", "issue_status"];
      const colIndex = headers.findIndex((h) =>
        statusHeaders.includes(String(h).trim().toLowerCase())
      );

      if (colIndex !== -1) {
        let targetRowIndex = rows.length;
        for (let r = 1; r < rows.length; r++) {
          const cell = rows[r]?.[colIndex];
          if (!cell || String(cell).trim() === "") {
            targetRowIndex = r;
            break;
          }
        }
        const colLetter = getColumnLetter(colIndex);
        const cellRange = `${config.validationTabName}!${colLetter}${targetRowIndex + 1}`;

        await sheets.spreadsheets.values.update({
          spreadsheetId: config.sheetId,
          range: cellRange,
          valueInputOption: "RAW",
          requestBody: { values: [[statusValue]] },
        });
      }
    }

    // 3. Process Issue Creations
    if (issueCreates.length > 0) {
      // Group creates by tabName
      const createsByTab: Record<string, any[]> = {};
      issueCreates.forEach((c) => {
        const tab = c.tabName || "App";
        if (!createsByTab[tab]) createsByTab[tab] = [];
        createsByTab[tab].push(c.newData);
      });

      for (const [tabName, issuesToCreate] of Object.entries(createsByTab)) {
        const mappings = project.columnMappings.filter((m) => m.tabName === tabName);
        if (mappings.length === 0) continue;

        const maxIndex = Math.max(...mappings.map((m) => m.columnIndex));
        const newRows: string[][] = [];

        issuesToCreate.forEach((issueData) => {
          const row = Array(maxIndex + 1).fill("");
          mappings.forEach((mapping) => {
            const val = issueData[mapping.fieldKey];
            if (val !== undefined && val !== null) {
              row[mapping.columnIndex] = Array.isArray(val) ? val.join(", ") : String(val);
            }
          });
          newRows.push(row);
        });

        const range = `${tabName}!A:${getColumnLetter(maxIndex)}`;
        await sheets.spreadsheets.values.append({
          spreadsheetId: config.sheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: newRows,
          },
        });
      }
    }

    // 4. Process Issue Updates in Batch
    if (issueUpdates.length > 0) {
      // Group updates by tabName + row
      // We will batchGet the existing rows, modify them, and batchUpdate
      const rangesToFetch: string[] = [];
      const updateKeys: string[] = []; // format: tabName|rowIndex

      // Group columns mappings by tabName
      const tabMappings: Record<string, any[]> = {};
      project.columnMappings.forEach((m) => {
        if (!tabMappings[m.tabName]) tabMappings[m.tabName] = [];
        tabMappings[m.tabName].push(m);
      });

      issueUpdates.forEach((u) => {
        const tab = u.tabName;
        const rowIdx = parseInt(String(u.sheetRowIndex), 10);
        if (!tab || isNaN(rowIdx)) return;

        const mappings = tabMappings[tab] || [];
        if (mappings.length === 0) return;

        const maxIndex = Math.max(...mappings.map((m) => m.columnIndex));
        const maxColLetter = getColumnLetter(maxIndex);

        rangesToFetch.push(`${tab}!A${rowIdx}:${maxColLetter}${rowIdx}`);
        updateKeys.push(`${tab}|${rowIdx}`);
      });

      if (rangesToFetch.length > 0) {
        // Batch get all existing rows
        const getRes = await sheets.spreadsheets.values.batchGet({
          spreadsheetId: config.sheetId,
          ranges: rangesToFetch,
        });

        const valueRanges = getRes.data.valueRanges || [];
        const updateData: { range: string; values: string[][] }[] = [];

        valueRanges.forEach((vr, idx) => {
          const key = updateKeys[idx];
          if (!key) return;
          const [tabName, rowIdxStr] = key.split("|");
          const rowIdx = parseInt(rowIdxStr, 10);
          const existingRow = vr.values?.[0] || [];

          // Find the corresponding update payload
          const updateChange = issueUpdates.find(
            (u) => u.tabName === tabName && parseInt(String(u.sheetRowIndex), 10) === rowIdx
          );
          if (!updateChange) return;

          const mappings = tabMappings[tabName] || [];
          const maxIndex = Math.max(...mappings.map((m) => m.columnIndex));

          // Pad row if shorter than maxIndex
          const updatedRow = [...existingRow];
          while (updatedRow.length <= maxIndex) {
            updatedRow.push("");
          }

          // Apply updates
          mappings.forEach((mapping) => {
            const val = updateChange.newData[mapping.fieldKey];
            if (val !== undefined && val !== null) {
              updatedRow[mapping.columnIndex] = Array.isArray(val) ? val.join(", ") : String(val);
            }
          });

          const maxColLetter = getColumnLetter(maxIndex);
          updateData.push({
            range: `${tabName}!A${rowIdx}:${maxColLetter}${rowIdx}`,
            values: [updatedRow],
          });
        });

        // Batch update all modified rows in one API call
        if (updateData.length > 0) {
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: config.sheetId,
            requestBody: {
              valueInputOption: "USER_ENTERED",
              data: updateData,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[batch-update] Error processing batch writes:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to commit batch updates" }, { status: 500 });
  }
}
