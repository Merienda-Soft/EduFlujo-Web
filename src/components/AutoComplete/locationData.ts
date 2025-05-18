// locationData.ts
interface LocationData {
  pais: string[];
  departamento: string[];
  provincia: string[];
  localidad: string[];
  matricula: string[];
}

import jsonData from './data.json';

export const locationData = {
  ...jsonData as LocationData,
  
  getAutocompleteSuggestions: function(input: string, type: 'pais' | 'departamento' | 'provincia' | 'localidad' | 'matricula'): string[] {
    const data = this[type];
    if (!data) return [];
    
    const inputLower = input.toLowerCase();
    return data
      .filter(item => item.toLowerCase().includes(inputLower))
      .slice(0, 10);
  },
};