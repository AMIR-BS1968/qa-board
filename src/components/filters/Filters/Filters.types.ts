import { IssueFilters } from "@/features/dashboard/types";

export interface FiltersProps {
  filters: IssueFilters;
  setFilters: React.Dispatch<React.SetStateAction<IssueFilters>>;
  resetFilters: () => void;
  options: {
    modules: string[];
    assignees: string[];
  };
}
