export enum EvaluationToolType {
  RUBRIC = 1,
  CHECKLIST = 2
}

export type RubricCriteria = {
  name: string;
  weight: number;
  selected?: number;
  levels: {
    description: string;
    score: number;
  }[];
};

export type RubricData = {
  title: string;
  criteria: RubricCriteria[];
  totalScore?: number;
};

export type ChecklistItem = {
  description: string;
  required: boolean;
  checked?: boolean;
};

export type ChecklistData = {
  title: string;
  items: ChecklistItem[];
  passingScore?: number;
};

export type EvaluationMethodology = {
  type: EvaluationToolType;
  data: RubricData | ChecklistData;
};