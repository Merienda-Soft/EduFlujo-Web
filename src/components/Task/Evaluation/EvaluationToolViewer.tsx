'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EvaluationToolType, ChecklistData, RubricData } from '../../../types/evaluation';
import { calculateRubricScore, validateChecklistCompletion } from '../../../utils/evaluation/helpers';

export default function EvaluationToolViewer({ 
  methodology, 
  onScoreChange,
  onEvaluationChange, 
  initialScore
}: {
  methodology: {
    type: EvaluationToolType;
    methodology: RubricData | ChecklistData;
  } | null;
  onScoreChange?: (score: number) => void;
  onEvaluationChange?: (updatedMethodology: RubricData | ChecklistData) => void;
  initialScore?: number;
}) {
  const [selectedLevels, setSelectedLevels] = useState<{criterionIndex: number, levelIndex: number}[]>([]);
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const [currentMethodology, setCurrentMethodology] = useState<RubricData | ChecklistData | null>(null);

  // Inicialización cuando cambia methodology
  useEffect(() => {
    if (!methodology) return;

    const methodologyData = methodology.methodology;
    
    if (methodology.type === EvaluationToolType.CHECKLIST) {
      const checklist = methodologyData as ChecklistData;
      const initialChecked = checklist.items.map(item => item.checked || false);
      setCheckedItems(initialChecked);
      setCurrentMethodology(checklist);
    } else if (methodology.type === EvaluationToolType.RUBRIC) {
      const rubric = methodologyData as RubricData;
      const initialSelected = rubric.criteria.map((criterion, i) => ({
        criterionIndex: i,
        levelIndex: criterion.selected || 0
      }));
      setSelectedLevels(initialSelected);
      setCurrentMethodology(rubric);
    }
  }, [methodology?.type]);

  useEffect(() => {
    if (!methodology?.methodology) return;
    
    const methodologyData = methodology.methodology;
    
    if (methodology.type === EvaluationToolType.CHECKLIST) {
      const checklist = methodologyData as ChecklistData;
      const newChecked = checklist.items.map(item => item.checked || false);
      
      const hasChanges = newChecked.some((checked, index) => checked !== checkedItems[index]);
      if (hasChanges) {
        setCheckedItems(newChecked);
        setCurrentMethodology(checklist);
      }
    } else if (methodology.type === EvaluationToolType.RUBRIC) {
      const rubric = methodologyData as RubricData;
      const newSelected = rubric.criteria.map((criterion, i) => ({
        criterionIndex: i,
        levelIndex: criterion.selected || 0
      }));
      
      const hasChanges = newSelected.some((sel, index) => 
        sel.levelIndex !== selectedLevels[index]?.levelIndex
      );
      if (hasChanges) {
        setSelectedLevels(newSelected);
        setCurrentMethodology(rubric);
      }
    }
  }, [methodology?.methodology]); 

  // Calcula el score y envía los datos actualizados cuando cambian los estados internos
  useEffect(() => {
    if (!methodology || !currentMethodology) return;
    
    let score = 0;
    let updatedMethodology = null;
    
    if (methodology.type === EvaluationToolType.CHECKLIST) {
      const checklist = currentMethodology as ChecklistData;
      const { score: calculatedScore } = validateChecklistCompletion(checklist, checkedItems);
      score = calculatedScore;
      
      // Actualizar methodology 
      updatedMethodology = {
        ...checklist,
        items: checklist.items.map((item, index) => ({
          ...item,
          checked: checkedItems[index] || false
        }))
      };
    } else if (methodology.type === EvaluationToolType.RUBRIC) {
      const rubric = currentMethodology as RubricData;
      score = calculateRubricScore(rubric, selectedLevels);
      
      // Actualizar methodology
      updatedMethodology = {
        ...rubric,
        criteria: rubric.criteria.map((criterion, index) => ({
          ...criterion,
          selected: selectedLevels[index]?.levelIndex || 0
        }))
      };
    }
    
    if (onScoreChange && score !== undefined) {
      onScoreChange(score);
    }

    if (onEvaluationChange && updatedMethodology) {
      onEvaluationChange(updatedMethodology);
    }
  }, [checkedItems, selectedLevels]); 

  // Handlers memoizados
  const handleCheckboxChange = useCallback((index: number) => {
    setCheckedItems(prev => {
      const newChecked = [...prev];
      newChecked[index] = !newChecked[index];
      return newChecked;
    });
  }, []);

  const handleRadioChange = useCallback((criterionIndex: number, levelIndex: number) => {
    setSelectedLevels(prev => {
      const newSelected = [...prev];
      newSelected[criterionIndex] = { criterionIndex, levelIndex };
      return newSelected;
    });
  }, []);

  if (!methodology) {
    return <div className="text-gray-500">No hay herramienta de evaluación definida</div>;
  }

  if (methodology.type === EvaluationToolType.CHECKLIST) {
    const checklist = currentMethodology as ChecklistData;
    if (!checklist) return null;

    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">{checklist.title}</h3>
        <div className="space-y-2">
          {checklist.items.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={checkedItems[index] || false}
                onChange={() => handleCheckboxChange(index)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={item.required ? 'font-medium' : 'text-gray-600'}>
                {item.description}
                {item.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            Elementos completados: {checkedItems.filter(Boolean).length} de {checklist.items.length}
          </div>
          <div className="text-sm text-gray-600">
            Elementos requeridos completados: {
              checklist.items.filter((item, index) => item.required && checkedItems[index]).length
            } de {checklist.items.filter(item => item.required).length}
          </div>
        </div>
      </div>
    );
  }

  if (methodology.type === EvaluationToolType.RUBRIC) {
    const rubric = currentMethodology as RubricData;
    if (!rubric) return null;

    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">{rubric.title}</h3>
        <div className="space-y-4">
          {rubric.criteria.map((criterion, criterionIndex) => (
            <div key={criterionIndex} className="border rounded-lg p-4">
              <div className="font-medium mb-2">
                {criterion.name} (Peso: {criterion.weight}%)
              </div>
              <div className="space-y-2">
                {criterion.levels.map((level, levelIndex) => (
                  <div key={levelIndex} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`criterion-${criterionIndex}`}
                      checked={selectedLevels[criterionIndex]?.levelIndex === levelIndex}
                      onChange={() => handleRadioChange(criterionIndex, levelIndex)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1">
                      {level.description} ({level.score} pts)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            Puntuación actual: {calculateRubricScore(rubric, selectedLevels)}/100
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-gray-500">Tipo de herramienta no reconocido</div>;
}