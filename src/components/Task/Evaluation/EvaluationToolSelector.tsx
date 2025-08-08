import { EvaluationToolType } from '../../../types/evaluation';

interface EvaluationToolSelectorProps {
  selectedType: EvaluationToolType | null;
  onChange: (type: EvaluationToolType) => void;
}

export default function EvaluationToolSelector({ 
  selectedType, 
  onChange 
}: EvaluationToolSelectorProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
        Tipo de Evaluación
      </label>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChange(EvaluationToolType.RUBRIC)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            selectedType === EvaluationToolType.RUBRIC
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-700 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          Rúbrica
        </button>
        <button
          type="button"
          onClick={() => onChange(EvaluationToolType.CHECKLIST)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            selectedType === EvaluationToolType.CHECKLIST
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-700 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          Lista de Cotejo
        </button>
      </div>
    </div>
  );
}