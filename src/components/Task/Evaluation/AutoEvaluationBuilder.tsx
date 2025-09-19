import { useState } from 'react';
import { AutoEvaluationBuilderData, AutoEvaluationCriteria, AutoEvaluationLevel } from '../../../types/evaluation';
import { calculateAutoEvaluationScore } from '../../../utils/evaluation/helpers';
import { TrashIcon } from '@heroicons/react/24/outline';

type AutoEvaluationBuilderProps = {
  initialData?: AutoEvaluationBuilderData;
  onChange: (data: AutoEvaluationBuilderData) => void;
};

export default function AutoEvaluationBuilder({ initialData, onChange }: AutoEvaluationBuilderProps) {
  const [autoEvaluation, setAutoEvaluation] = useState<AutoEvaluationBuilderData>(() => {
    if (initialData) {
      return {
        title: initialData.title || 'Autoevaluación',
        dimensions: initialData.dimensions || [
          { name: 'SER', criteria: [] },
          { name: 'DECIDIR', criteria: [] }
        ]
      };
    }
    return {
      title: 'Autoevaluación',
      dimensions: [
        { name: 'SER', criteria: [] },
        { name: 'DECIDIR', criteria: [] }
      ]
    };
  });

  const updateAutoEvaluation = (updates: Partial<AutoEvaluationBuilderData>) => {
    const updated = { ...autoEvaluation, ...updates };
    setAutoEvaluation(updated);
    onChange(updated);
  };

  const createDefaultLevels = (): AutoEvaluationLevel[] => [
    { name: 'Si', value: 3, selected: false },
    { name: 'A veces', value: 2, selected: false },
    { name: 'No', value: 1, selected: false }
  ];

  const handleAddCriterion = (dimensionIndex: number) => {
    const newCriterion: AutoEvaluationCriteria = {
      description: '',
      levels: createDefaultLevels()
    };

    const updatedDimensions = [...autoEvaluation.dimensions];
    updatedDimensions[dimensionIndex].criteria.push(newCriterion);
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  const handleRemoveCriterion = (dimensionIndex: number, criterionIndex: number) => {
    const updatedDimensions = [...autoEvaluation.dimensions];
    updatedDimensions[dimensionIndex].criteria.splice(criterionIndex, 1);
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  const handleCriterionChange = (dimensionIndex: number, criterionIndex: number, description: string) => {
    const updatedDimensions = [...autoEvaluation.dimensions];
    updatedDimensions[dimensionIndex].criteria[criterionIndex].description = description;
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  const handleLevelChange = (dimensionIndex: number, criterionIndex: number, levelIndex: number, field: keyof AutoEvaluationLevel, value: string | number) => {
    const updatedDimensions = [...autoEvaluation.dimensions];
    const level = updatedDimensions[dimensionIndex].criteria[criterionIndex].levels[levelIndex];
    
    if (field === 'name') {
      level.name = value as string;
    } else if (field === 'value') {
      level.value = value as number;
    }
    
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  const handleAddLevel = (dimensionIndex: number, criterionIndex: number) => {
    const updatedDimensions = [...autoEvaluation.dimensions];
    const newLevel: AutoEvaluationLevel = { name: '', value: 0, selected: false };
    updatedDimensions[dimensionIndex].criteria[criterionIndex].levels.push(newLevel);
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  const handleRemoveLevel = (dimensionIndex: number, criterionIndex: number, levelIndex: number) => {
    const updatedDimensions = [...autoEvaluation.dimensions];
    updatedDimensions[dimensionIndex].criteria[criterionIndex].levels.splice(levelIndex, 1);
    updateAutoEvaluation({ dimensions: updatedDimensions });
  };

  return (
    <div className="space-y-4">
      {/* Título editable */}
      <input
        type="text"
        placeholder="Título de la autoevaluación"
        value={autoEvaluation.title}
        onChange={(e) => updateAutoEvaluation({ title: e.target.value })}
        className="w-full p-2 border rounded"
      />

      {/* Dimensiones */}
      {autoEvaluation.dimensions.map((dimension, dimensionIndex) => (
        <div key={dimension.name} className="border-2 border-gray-600 rounded-lg p-2">
          <div className="flex justify-between items-center m-2">
            <h3 className="font-medium text-sm">
              {dimension.name} 
            </h3>
            <button
              type="button"
              onClick={() => handleAddCriterion(dimensionIndex)}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              + Añadir Criterio
            </button>
          </div>

          {/* Criterios de la dimensión */}
          {dimension.criteria.map((criterion, criterionIndex) => (
            <div key={criterionIndex} className="border p-2 rounded m-2">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Descripción del criterio"
                  value={criterion.description}
                  onChange={(e) => handleCriterionChange(dimensionIndex, criterionIndex, e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCriterion(dimensionIndex, criterionIndex)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Eliminar criterio"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Niveles del criterio */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Niveles:</label>
                {criterion.levels.map((level, levelIndex) => (
                  <div key={levelIndex} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nivel"
                      value={level.name}
                      onChange={(e) => handleLevelChange(dimensionIndex, criterionIndex, levelIndex, 'name', e.target.value)}
                      className="flex-1 p-1 border rounded text-sm"
                    />
                    <input
                      min="0"
                      value={level.value}
                      onChange={(e) => handleLevelChange(dimensionIndex, criterionIndex, levelIndex, 'value', Number(e.target.value))}
                      className="w-16 p-1 border rounded text-sm text-center cursor-not-allowed"
                      readOnly
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      ))}
    </div>
  );
}