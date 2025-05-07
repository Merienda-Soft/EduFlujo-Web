import React, { useState, useEffect, useRef } from 'react';
import { locationData } from './locationData';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  type: 'pais' | 'departamento' | 'provincia' | 'localidad' | 'matricula';
  disabled?: boolean;
  className?: string;
  suggestionsPosition?: 'top' | 'bottom'; 
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  type,
  disabled,
  className = 'w-full min-w-[250px] px-3 py-2 border rounded-md',
  suggestionsPosition = 'top' 
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && value.length > 1) {
      const matches = locationData.getAutocompleteSuggestions(value, type);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [value, type]);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const suggestionPositionClasses = suggestionsPosition === 'top' 
    ? 'bottom-full mb-1' 
    : 'top-full mt-1';

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        disabled={disabled}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className={`absolute z-50 min-w-[250px] ${suggestionPositionClasses} bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600 max-h-60 overflow-auto`}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-600"
              onClick={() => handleSelect(suggestion)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};