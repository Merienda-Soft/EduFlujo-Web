import React, { useState, useEffect, useRef } from 'react';
import { locationData } from './locationData';
import Swal from 'sweetalert2';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  type: 'pais' | 'departamento' | 'provincia' | 'localidad' | 'matricula';
  disabled?: boolean;
  className?: string;
  suggestionsPosition?: 'top' | 'bottom';
  placeholder?: string;
  allowAddNew?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  type,
  disabled,
  className = 'w-full min-w-[250px] px-3 py-2 border rounded-md',
  suggestionsPosition = 'top',
  placeholder = '',
  allowAddNew = false 
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatValue = (val: string) => val.toUpperCase().trim();

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Generate suggestions when input changes
  useEffect(() => {
    if (inputValue.length > 1 && isTyping) {
      const formattedValue = formatValue(inputValue);
      const matches = locationData.getAutocompleteSuggestions(formattedValue, type);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, type, isTyping, allowAddNew]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsTyping(true);
    if (newValue.length === 0) {
      onChange('');
    }
  };

  const handleSelect = (suggestion: string) => {
    const formattedValue = formatValue(suggestion);
    setInputValue(formattedValue);
    onChange(formattedValue);
    setShowSuggestions(false);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      const formattedValue = formatValue(inputValue);
      
      if (suggestions.includes(formattedValue)) {
        onChange(formattedValue);
      } else if (inputValue !== value) {
        // Reset to original value if not selected from suggestions
        setInputValue(value);
      }
      setShowSuggestions(false);
      setIsTyping(false);
    }, 200);
  };

  const handleFocus = () => {
    if (inputValue.length > 1) {
      const formattedValue = formatValue(inputValue);
      const matches = locationData.getAutocompleteSuggestions(formattedValue, type);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0 || allowAddNew);
    }
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
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {showSuggestions && (
        <ul 
          className={`absolute z-50 min-w-[250px] ${suggestionPositionClasses} bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600 max-h-60 overflow-auto`}
        >
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