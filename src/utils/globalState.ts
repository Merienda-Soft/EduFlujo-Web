'use client';
import Cookies from 'js-cookie';
import { getYearManagements } from '../utils/managementService';

interface ManagementGlobal {
  id: number;
  year: number; 
  status: number;
  [key: string]: any;
}

export let managementGlobal: ManagementGlobal = {
  id: 0,
  year: 0,
  status: 0
};

export const setManagementGlobal = (data: Partial<ManagementGlobal>) => {
  managementGlobal = { ...managementGlobal, ...data };
  Cookies.set('managementGlobal', JSON.stringify(managementGlobal), {
    expires: 1,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
};

const getActiveManagement = async (): Promise<ManagementGlobal> => {
  try {
    const managements = await getYearManagements();
    
    if (!managements || managements.length === 0) {
      return {
        id: 0,
        year: 0,
        status: 0
      };
    }


    const activeManagement = managements.find((m: any) => m.status === 1);
    console.log('Gestión activa:', activeManagement);
    
    if (activeManagement) {
      return {
        id: activeManagement.id,
        year: activeManagement.management,
        status: activeManagement.status
      };
    }
    
    const latestManagement = managements.reduce((prev, current) => 
      (prev.id > current.id) ? prev : current
    );
    
    return {
      id: latestManagement.id,
      year: latestManagement.management.toString(),
      status: latestManagement.status
    };
    
  } catch (error) {
    console.error('Error al obtener gestión activa:', error);
    return {
      id: 0,
      year: 0,
      status: 0
    };
  }
};

const initializeManagement = async () => {
  const stored = Cookies.get('managementGlobal');
  
  const currentManagements = await getYearManagements();
  const storedManagement = stored ? JSON.parse(stored) : null;
  
  if (storedManagement && storedManagement.id) {
    const isValid = currentManagements.some(m => m.id === storedManagement.id);
    if (isValid) {
      managementGlobal = storedManagement;
      return;
    }
  }

  managementGlobal = await getActiveManagement();
  Cookies.set('managementGlobal', JSON.stringify(managementGlobal));
};


if (typeof window !== 'undefined') {
  initializeManagement();
}

export const getCurrentManagementId = (): number => {
  return managementGlobal?.id ?? 0;
};

export const refreshManagementGlobal = async () => {
  managementGlobal = await getActiveManagement();
  Cookies.set('managementGlobal', JSON.stringify(managementGlobal));
  return managementGlobal;
};


export const findManagementByYear = async (year: string) => {
  const managements = await getYearManagements();
  return managements.find(m => m.management.toString() === year);
};