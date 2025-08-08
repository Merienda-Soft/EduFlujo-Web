'use client';

import React, { useState } from 'react';
import { EvaluationToolType } from '../../../types/evaluation';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function StudentEvaluationView({
  methodology
}: {
  methodology: {
    type: EvaluationToolType;
    methodology: any;
  } | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!methodology) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mt-4">
        <h3 className="text-md font-semibold text-gray-900 dark:text-white">
          Criterios de Evaluación
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          No se ha definido una metodología de evaluación
        </p>
      </div>
    );
  }

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const renderPreview = () => {
    const typeName = methodology.type === EvaluationToolType.CHECKLIST
      ? 'Lista de Cotejo'
      : 'Rúbrica de Evaluación';

    return (
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleExpand}
      >
        <div>
          <h3 className="text-md font-semibold text-gray-900 dark:text-white">
            {methodology.methodology.title || typeName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {methodology.type === EvaluationToolType.CHECKLIST
              ? `${methodology.methodology.items.length} ítems de evaluación`
              : `${methodology.methodology.criteria.length} criterios de evaluación`}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </div>
    );
  };

  const renderChecklistDetails = () => {
    const { items } = methodology.methodology;

    return (
      <div className="mt-4 space-y-3">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              {item.checked ? (
                <CheckCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item.description}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
          {items.filter(i => i.required).length > 0 ? (
            <>Debes cumplir con todos los ítems requeridos para obtener la máxima calificación.</>
          ) : (
            <>Cada ítem cumplido contribuirá a tu calificación final.</>
          )}
        </div>
      </div>
    );
  };

  const getColorByScore = (score: number) => {
    switch (score) {
      case 5:
        return 'text-green-600';
      case 3:
        return 'text-orange-500';
      case 1:
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const renderRubricDetails = () => {
    const { criteria } = methodology.methodology;

    return (
      <div className="mt-4 space-y-4">
        {criteria.map((criterion, index) => {
          const selectedLevel = criterion.levels[criterion.selected];
          return (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                  {criterion.name}
                </h4>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Peso: {criterion.weight}%
                </span>
              </div>

              <div className="space-y-2">
                {criterion.levels.map((level, levelIndex) => {
                  const isSelected = levelIndex === criterion.selected;
                  return (
                    <div
                      key={levelIndex}
                      className={`flex items-start gap-2 p-2 rounded ${
                        isSelected ? `bg-gray-100 dark:bg-gray-700 ${getColorByScore(level.score)} font-semibold` : ''
                      }`}
                    >
                      <div className="h-5 w-5 rounded-full flex items-center justify-center mt-0.5 bg-gray-200 dark:bg-gray-600">
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-100">
                          {level.score}
                        </span>
                      </div>
                      <p className="text-xs">
                        {level.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
          Tu calificación se calculó en función del nivel seleccionado para cada criterio.
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mt-4">
      {renderPreview()}
      {isExpanded && (
        <>
          {methodology.type === EvaluationToolType.CHECKLIST
            ? renderChecklistDetails()
            : renderRubricDetails()}
        </>
      )}
    </div>
  );
}
