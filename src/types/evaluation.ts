export enum EvaluationToolType {
  RUBRIC = 1,
  CHECKLIST = 2,
  AUTO_EVALUATION = 3
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

export type AutoEvaluationLevel = {
  name: string; // "Si", "A veces", "No"
  value: number; 
  selected: boolean;
};

export type AutoEvaluationCriteria = {
  description: string; 
  levels: AutoEvaluationLevel[];
};

export type AutoEvaluationDimension = {
  name: 'SER' | 'DECIDIR';
  criteria: AutoEvaluationCriteria[];
};

export type AutoEvaluationBuilderData = {
  title: string;
  dimensions: AutoEvaluationDimension[]; 
};

export type EvaluationMethodology = {
  type: EvaluationToolType;
  data: RubricData | ChecklistData | AutoEvaluationBuilderData;
};