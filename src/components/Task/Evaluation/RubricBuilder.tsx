import { useState } from 'react';
import { RubricData, RubricCriteria } from '../../../types/evaluation';
import { TrashIcon } from '@heroicons/react/24/outline';

type RubricBuilderProps = {
  initialData?: RubricData;
  onChange: (data: RubricData) => void;
};

export default function RubricBuilder({ initialData, onChange }: RubricBuilderProps) {
  const [rubric, setRubric] = useState<RubricData>(() => {
    if (initialData) {
      return {
        title: initialData.title || '',
        criteria: initialData.criteria?.map(criterion => ({
          name: criterion.name || '',
          weight: criterion.weight || 0,
          selected: criterion.selected || 0,
          levels: criterion.levels?.map(level => ({
            description: level.description || '',
            score: level.score || 0
          })) || [
            { description: 'Excelente', score: 5 },
            { description: 'Bueno', score: 3 },
            { description: 'Regular', score: 1 }
          ]
        })) || []
      };
    }
    return {
      title: '',
      criteria: []
    };
  });

  const updateRubric = (updates: Partial<RubricData>) => {
    const updated = { ...rubric, ...updates };
    setRubric(updated);
    onChange(updated);
  };

  const handleAddCriterion = () => {
    const newCriterion: RubricCriteria = {
      name: '',
      weight: 0,
      selected: 0,
      levels: [
        { description: 'Excelente', score: 5 },
        { description: 'Bueno', score: 3 },
        { description: 'Regular', score: 1 }
      ]
    };
    updateRubric({
      criteria: [...rubric.criteria, newCriterion]
    });
  };

  const handleRemoveCriterion = (index: number) => {
    const updatedCriteria = rubric.criteria.filter((_, i) => i !== index);
    updateRubric({ criteria: updatedCriteria });
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Título de la rúbrica"
        value={rubric.title}
        onChange={(e) => updateRubric({ title: e.target.value })}
        className="w-full p-2 border rounded"
      />

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleAddCriterion}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          + Añadir Criterio
        </button>
      </div>
      
      {rubric.criteria.map((criterion, idx) => (
        <div key={idx} className="border p-3 rounded-lg">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Nombre del criterio"
              value={criterion.name}
              onChange={(e) => {
                const updatedCriteria = [...rubric.criteria];
                updatedCriteria[idx].name = e.target.value;
                updateRubric({ criteria: updatedCriteria });
              }}
              className="flex-1 p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => handleRemoveCriterion(idx)}
              className="text-red-500 hover:text-red-700 p-2"
              title="Eliminar criterio"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-sm">Peso (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={criterion.weight}
                onChange={(e) => {
                  const updatedCriteria = [...rubric.criteria];
                  updatedCriteria[idx].weight = Number(e.target.value);
                  updateRubric({ criteria: updatedCriteria });
                }}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <h4 className="font-medium mb-2">Niveles de desempeño:</h4>
          {criterion.levels.map((level, levelIdx) => (
            <div key={levelIdx} className="flex gap-2 mb-2">
              <input
                type="text"
                value={level.description}
                onChange={(e) => {
                  const updatedCriteria = [...rubric.criteria];
                  updatedCriteria[idx].levels[levelIdx].description = e.target.value;
                  updateRubric({ criteria: updatedCriteria });
                }}
                className="flex-1 p-2 border rounded text-sm"
              />
              <input
                type="number"
                min="0"
                value={level.score}
                onChange={(e) => {
                  const updatedCriteria = [...rubric.criteria];
                  updatedCriteria[idx].levels[levelIdx].score = Number(e.target.value);
                  updateRubric({ criteria: updatedCriteria });
                }}
                className="w-20 p-2 border rounded text-sm"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}