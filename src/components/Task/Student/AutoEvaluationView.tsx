'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AutoEvaluationBuilderData } from '../../../types/evaluation';
import { calculateAutoEvaluationScore } from '../../../utils/evaluation/helpers';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface AutoEvaluationViewProps {
  methodology: AutoEvaluationBuilderData;
  onEvaluationChange?: (updatedMethodology: AutoEvaluationBuilderData, score: number) => void;
  onScoreChange?: (score: number) => void;
  onCompletionChange?: (isComplete: boolean) => void;
  disabled?: boolean;
}

export default function AutoEvaluationView({ 
  methodology, 
  onEvaluationChange,
  onScoreChange,
  onCompletionChange,
  disabled = false
}: AutoEvaluationViewProps) {
  const [autoEvaluationState, setAutoEvaluationState] = useState<AutoEvaluationBuilderData>(methodology);
  const [expandedDimensions, setExpandedDimensions] = useState<boolean[]>([]);

  // Inicialización cuando cambia methodology
  useEffect(() => {
    if (methodology) {
      setAutoEvaluationState(methodology);
      setExpandedDimensions(methodology.dimensions.map(() => false));
    }
  }, [methodology]);

  // Calcular score y enviar cambios cuando cambia el estado
  useEffect(() => {
    if (!autoEvaluationState) return;
    
    const score = calculateAutoEvaluationScore(autoEvaluationState);
    const completed = isCompleted();
    
    if (onScoreChange) {
      onScoreChange(score);
    }

    if (onCompletionChange) {
      onCompletionChange(completed);
    }

    if (onEvaluationChange) {
      onEvaluationChange(autoEvaluationState, score);
    }
  }, [autoEvaluationState, onEvaluationChange, onScoreChange, onCompletionChange]);

  const toggleDimensionExpansion = useCallback((dimensionIndex: number) => {
    setExpandedDimensions(prev => {
      const newExpanded = [...prev];
      newExpanded[dimensionIndex] = !newExpanded[dimensionIndex];
      return newExpanded;
    });
  }, []);

  const handleLevelSelect = useCallback((dimensionIndex: number, criterionIndex: number, levelIndex: number) => {
    if (disabled) return;

    setAutoEvaluationState(prevState => {
      const updatedState = { ...prevState };
      const dimension = { ...updatedState.dimensions[dimensionIndex] };
      const criterion = { ...dimension.criteria[criterionIndex] };
      
      // Crear nueva copia de los niveles
      const newLevels = criterion.levels.map((level, idx) => ({
        ...level,
        selected: idx === levelIndex
      }));
      
      // Actualizar el criterio con los nuevos niveles
      const newCriterion = { ...criterion, levels: newLevels };
      
      // Actualizar la dimensión con el nuevo criterio
      const newCriteria = [...dimension.criteria];
      newCriteria[criterionIndex] = newCriterion;
      const newDimension = { ...dimension, criteria: newCriteria };
      
      // Actualizar las dimensiones
      const newDimensions = [...updatedState.dimensions];
      newDimensions[dimensionIndex] = newDimension;
      
      return { ...updatedState, dimensions: newDimensions };
    });
  }, [disabled]);

  const getDimensionScore = (dimensionIndex: number): number => {
    const dimension = autoEvaluationState.dimensions[dimensionIndex];
    if (!dimension.criteria.length) return 0;
    
    const criterionWeight = 50 / dimension.criteria.length; // 50% dividido entre criterios
    let dimensionTotal = 0;
    
    for (const criterion of dimension.criteria) {
      const selectedLevel = criterion.levels.find(level => level.selected);
      if (selectedLevel) {
        const maxValue = Math.max(...criterion.levels.map(l => l.value));
        const levelScore = (selectedLevel.value / maxValue) * criterionWeight;
        dimensionTotal += levelScore;
      }
    }
    
    return Math.round(dimensionTotal);
  };

  const getTotalScore = (): number => {
    return calculateAutoEvaluationScore(autoEvaluationState);
  };

  const isCompleted = (): boolean => {
    return autoEvaluationState.dimensions.every(dimension =>
      dimension.criteria.every(criterion =>
        criterion.levels.some(level => level.selected)
      )
    );
  };

  if (!autoEvaluationState) {
    return <div className="text-gray-500">No hay autoevaluación disponible</div>;
  }

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      {!disabled && (
        <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Instrucciones:</strong> Evalúa cada criterio seleccionando en el nivel que mejor describa tu desempeño. 
          </p>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Dimensiones */}
        <div className="space-y-4">
          {autoEvaluationState.dimensions.map((dimension, dimensionIndex) => (
            <div key={dimension.name} className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              {/* Header clickeable de la dimensión */}
              <div 
                className="p-4 bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => toggleDimensionExpansion(dimensionIndex)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                    {dimension.name}
                  </h4>
                  <div className="flex items-center gap-3">
                    {expandedDimensions[dimensionIndex] ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Indicador de progreso cuando está colapsado */}
                {!expandedDimensions[dimensionIndex] && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (dimension.criteria.filter(c => c.levels.some(l => l.selected)).length / dimension.criteria.length) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {dimension.criteria.filter(c => c.levels.some(l => l.selected)).length}/{dimension.criteria.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contenido expandible */}
              {expandedDimensions[dimensionIndex] && (
                <div className="p-4 space-y-4">
                  {dimension.criteria.map((criterion, criterionIndex) => (
                    <div key={criterionIndex} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                        {criterion.description}
                      </div>
                      
                      {/* Niveles del criterio */}
                      <div className="space-y-2">
                        {criterion.levels.map((level, levelIndex) => (
                          <label key={levelIndex} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                            level.selected 
                              ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-600' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
                            <input
                              type="radio"
                              name={`auto-criterion-${dimensionIndex}-${criterionIndex}`}
                              checked={level.selected}
                              onChange={() => handleLevelSelect(dimensionIndex, criterionIndex, levelIndex)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              disabled={disabled}
                            />
                            <span className="flex-1 text-gray-700 dark:text-gray-300">
                              {level.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Indicador de completitud */}
        <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="m-2 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isCompleted() ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isCompleted() 
                ? 'Autoevaluación completada' 
                : 'Faltan criterios por evaluar'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
