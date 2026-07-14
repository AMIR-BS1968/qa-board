export interface SheetConfig {
  id: string;
  sheetUrl: string;
  sheetId: string;
  selectedTabs: string[];
  headerRow: number;
  dataStartRow: number;
}

export interface ColumnMapping {
  id: string;
  tabName: string;
  fieldKey: string;
  columnIndex: number;
}

export interface StatusConfig {
  id: string;
  statusValue: string;
  displayLabel: string;
  color: string;
  category: "open" | "closed" | "fixed" | "qa" | "other";
  sortOrder?: number;
  kanbanEnabled?: boolean;
}

export interface MetricVisibility {
  id: string;
  metricKey: string;
  enabled: boolean;
}

export interface ProjectData {
  id: string;
  name: string;
  slug: string;
  sheetConfigs: SheetConfig[];
  columnMappings: ColumnMapping[];
  statusConfigs: StatusConfig[];
  metricVisibilities: MetricVisibility[];
}
