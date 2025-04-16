'use client';
import Cookies from 'js-cookie';
import { getYearManagements } from '../utils/managementService';

// Definición del tipo para managementGlobal
interface ManagementGlobal {
  id: number;
  year: number;
  [key: string]: any; // Para propiedades adicionales
}

export let managementGlobal: ManagementGlobal | null = null;

export const setManagementGlobal = (data: ManagementGlobal | null) => {
  managementGlobal = data;
  Cookies.set('managementGlobal', JSON.stringify(managementGlobal), {
    expires: 1, 
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
};

// Función para obtener la gestión activa (con id y year)
const getActiveManagement = async (): Promise<ManagementGlobal> => {
  try {
    const managements = await getYearManagements();
    const activeManagement = managements?.find((m: any) => m.status === 1);
    
    if (activeManagement) {
      return {
        id: activeManagement.id,
        year: activeManagement.management,
        ...activeManagement 
      };
    }
    
    return {
      id: 0, 
      year: new Date().getFullYear()
    };
    
  } catch (error) {
    console.error('Error al obtener gestión activa:', error);
    return {
      id: 0,
      year: new Date().getFullYear()
    };
  }
};

const initializeManagement = async () => {
  const stored = Cookies.get('managementGlobal');
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.year === 'number' && typeof parsed.id === 'number') {
        managementGlobal = parsed;
        return;
      }
    } catch (e) {
      console.warn('Cookie inválida, se regenerará');
    }
  }
  
  managementGlobal = await getActiveManagement();
  Cookies.set('managementGlobal', JSON.stringify(managementGlobal));
};

if (typeof window !== 'undefined') {
  initializeManagement();
}

// Función helper para obtener el ID de la gestión actual
export const getCurrentManagementId = (): number => {
  return managementGlobal?.id ?? 0;
};