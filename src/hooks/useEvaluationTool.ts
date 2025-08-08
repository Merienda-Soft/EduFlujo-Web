import { useState } from 'react';
import { EvaluationToolType, RubricData, ChecklistData } from '../types/evaluation';

export default function useEvaluationTool() {
  const [tool, setTool] = useState<{
    type: EvaluationToolType | null;
    data: RubricData | ChecklistData | null;
  }>({ type: null, data: null });

  const initializeTool = (type: EvaluationToolType) => {
    const initialData = type === EvaluationToolType.RUBRIC
      ? { title: '', criteria: [] }
      : { title: '', items: [] };
    
    setTool({ type, data: initialData });
  };

  const updateToolData = (updates: Partial<RubricData | ChecklistData>) => {
    if (!tool.data) return;
    setTool(prev => ({
      ...prev,
      data: { ...prev.data!, ...updates }
    }));
  };

  return {
    tool,
    initializeTool,
    updateToolData,
    resetTool: () => setTool({ type: null, data: null })
  };
}