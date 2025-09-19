'use client';
import Cookies from 'js-cookie';
import { getYearManagements, getUserId } from '../utils/managementService';

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
  currentUserId?: number;
  currentUserEmail?: string;
}

let managementGlobal: ManagementGlobal = {
  id: 0,
  year: 0,
  status: 0,
  allManagements: [],
  currentUserId: undefined,
  currentUserEmail: undefined
};

let isInitialized = false; // Flag para evitar inicializaciones múltiples

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
  managementGlobal = { 
    ...managementGlobal, 
    ...data,
    currentManagement: data.currentManagement || 
      managementGlobal.allManagements.find(m => m.id === data.id) || 
      managementGlobal.currentManagement
  };
  
  if (managementGlobal.currentManagement) {
    managementGlobal.status = managementGlobal.currentManagement.status;
  }
  
  Cookies.set('managementGlobal', JSON.stringify(managementGlobal), {
    expires: 1,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
  notify();
};

export const getManagementGlobal = () => managementGlobal;

export const initializeManagement = async () => {
  if (isInitialized) {
    return;
  }

  try {
    const managements = await getYearManagements();
    const stored = Cookies.get('managementGlobal');
    
    let selectedManagement = managements[0];
    let storedUserId = undefined;
    let storedUserEmail = undefined;
    
    if (stored) {
      const parsed = JSON.parse(stored);
      const storedManagement = managements.find(m => m.id === parsed.id);
      if (storedManagement) selectedManagement = storedManagement;
      storedUserId = parsed.currentUserId;
      storedUserEmail = parsed.currentUserEmail;
    }
    
    const activeManagement = managements.find(m => m.status === 1);
    if (activeManagement) selectedManagement = activeManagement;
    
    setManagementGlobal({
      id: selectedManagement.id,
      year: selectedManagement.management,
      status: selectedManagement.status,
      allManagements: managements,
      currentManagement: selectedManagement,
      currentUserId: storedUserId,
      currentUserEmail: storedUserEmail
    });
    
    isInitialized = true; 
  } catch (error) {
    setManagementGlobal({
      id: 0,
      year: 0,
      status: 0,
      allManagements: [],
      currentManagement: {
        id: 0,
        management: 0,
        status: 0
      }
    });
    isInitialized = true; 
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
  return managementGlobal.currentManagement?.status === 1;
};

export const getUserIdByEmail = async (email: string): Promise<number | null> => {
  if (!email || email.trim() === '') {
    return null;
  }

  if (managementGlobal.currentUserId && managementGlobal.currentUserEmail === email) {
    return managementGlobal.currentUserId;
  }
  
  try {
    const response = await getUserId(email);
    const userId = response.id || null;
    
    if (userId) {
      setManagementGlobal({
        ...managementGlobal,
        currentUserId: userId,
        currentUserEmail: email
      });
    }
    
    return userId;
  } catch (error) {
    console.error('Error obteniendo ID del usuario:', error);
    return null;
  }
};


export const getCurrentUserId = () => {
  return managementGlobal.currentUserId || null;
};


export const getCurrentUserEmail = () => {
  return managementGlobal.currentUserEmail || null;
};

export const resetInitialization = () => {
  isInitialized = false;
};

export const clearUserData = () => {
  setManagementGlobal({
    ...managementGlobal,
    currentUserId: undefined,
    currentUserEmail: undefined
  });
};

export const isUserAuthenticated = () => {
  return !!(managementGlobal.currentUserId && managementGlobal.currentUserEmail);
};
