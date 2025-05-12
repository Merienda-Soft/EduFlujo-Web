'use client';
import Cookies from 'js-cookie';
import { getYearManagements } from '../utils/managementService';

interface Management {
  id: number;
  management: number;
  status: number;
}

interface ManagementGlobal {
  id: number;
  year: number;
  status: number;
  allManagements: Management[];
  currentManagement?: Management; 
}

let managementGlobal: ManagementGlobal = {
  id: 0,
  year: 0,
  status: 0,
  allManagements: []
};

const listeners: Array<() => void> = [];

export const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
};

const notify = () => listeners.forEach(listener => listener());

export const setManagementGlobal = (data: Partial<ManagementGlobal>) => {
  managementGlobal = { ...managementGlobal, ...data };
  Cookies.set('managementGlobal', JSON.stringify(managementGlobal), {
    expires: 1,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
  notify();
};

export const getManagementGlobal = () => managementGlobal;

export const initializeManagement = async () => {
  try {
    const managements = await getYearManagements();
    const stored = Cookies.get('managementGlobal');
    
    let selectedManagement = managements[0];
    
    if (stored) {
      const parsed = JSON.parse(stored);
      const storedManagement = managements.find(m => m.id === parsed.id);
      if (storedManagement) selectedManagement = storedManagement;
    }
    
    const activeManagement = managements.find(m => m.status === 1);
    if (activeManagement) selectedManagement = activeManagement;
    
    setManagementGlobal({
      id: selectedManagement.id,
      year: selectedManagement.management,
      status: selectedManagement.status,
      allManagements: managements,
      currentManagement: selectedManagement // Añadido
    });
  } catch (error) {
    console.error('Error inicializando gestión:', error);
  }
};

export const getCurrentManagementData = () => {
  return managementGlobal.currentManagement || {
    id: 0,
    management: 0,
    status: 0
  };
};

export const isCurrentManagementActive = () => {
  return managementGlobal.status === 1;
};