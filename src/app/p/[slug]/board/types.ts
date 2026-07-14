export interface StatusConfig {
  id: string;
  statusValue: string;
  displayLabel: string;
  color: string;
  category: string;
  kanbanEnabled?: boolean;
  sortOrder?: number;
}

export interface Issue {
  module: string;
  feature: string;
  issueTitle: string;
  issueDescription: string;
  stepsToReproduce: string;
  resources: string;
  issueStatus: string;
  reportedBy: string;
  devComments: string;
  estimation: string;
  spentTime: string;
  assignedDate: string;
  assignee: string;
  resolutionDate: string;
  qaComments: string;
  sheetSource: string;
  sheetRowIndex: number;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  slug: string;
  statusConfigs: StatusConfig[];
}
