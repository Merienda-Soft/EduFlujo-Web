import { RubricData, ChecklistData, AutoEvaluationBuilderData } from '../../types/evaluation';

export const calculateRubricScore = (
  rubric: RubricData,
  selectedLevels: { criterionIndex: number; levelIndex: number }[]
): number => {
  if (!rubric.criteria.length || !selectedLevels.length) return 0;
  
  const totalPossible = rubric.criteria.reduce((sum, criterion) => {
    const maxLevel = Math.max(...criterion.levels.map(l => l.score));
    return sum + (maxLevel * (criterion.weight / 100));
  }, 0);

  if (totalPossible === 0) return 0;

  const actualScore = selectedLevels.reduce((sum, { criterionIndex, levelIndex }) => {
    const criterion = rubric.criteria[criterionIndex];
    const level = criterion.levels[levelIndex];
    return sum + (level.score * (criterion.weight / 100));
  }, 0);

  // Convertir a porcentaje sobre 100
  const percentage = (actualScore / totalPossible) * 100;
  return Math.round(percentage);
};

export const validateChecklistCompletion = (
  checklist: ChecklistData,
  checkedItems: boolean[]
): { isValid: boolean; score: number } => {
  const requiredItems = checklist.items.filter(item => item.required);
  const checkedRequired = checklist.items
    .filter((item, index) => item.required && checkedItems[index])
    .length;

  const isValid = checkedRequired === requiredItems.length;
  const totalItems = checklist.items.length;
  const checkedCount = checkedItems.filter(Boolean).length;
  const score = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return { isValid, score };
};

// Helper autoevaluación
export const calculateAutoEvaluationScore = (data: AutoEvaluationBuilderData): number => {
  let total = 0;
  
  for (const dimension of data.dimensions) {
    if (!dimension.criteria.length) continue;
    
    const dimensionWeight = 50; // Cada dimensión vale 50%
    const criterionWeight = dimensionWeight / dimension.criteria.length; // Dividir entre criterios
    
    for (const criterion of dimension.criteria) {
      const selectedLevel = criterion.levels.find(level => level.selected);
      if (selectedLevel) {
        // El valor del nivel se multiplica por el peso del criterio
        const levelScore = (selectedLevel.value / criterion.levels.length) * criterionWeight;
        total += levelScore;
      }
    }
  }
  
  return Math.round(total);
};