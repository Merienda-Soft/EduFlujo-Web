import { httpRequestFactory } from './HttpRequestFactory';
import { getCurrentUserId } from './globalState';

export const getManagementNow = async () => {
    try {
        const { url, config } = httpRequestFactory.createRequest('/management');
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al obtener la gestión actual');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const createManagement = async (managementData: any) => {
    console.log('Management Data:', managementData);
    try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            throw new Error('Usuario no autenticado');
        }
        
        const { url, config } = httpRequestFactory.createRequest('/management', 'POST', {
            ...managementData,
            created_by: currentUserId
        });
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al crear la gestión');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getYearManagements = async () => {
    try {
        const { url, config } = httpRequestFactory.createRequest('/management/year');
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al obtener las gestiones');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getUserId = async (email: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(`/management/user/${email}`);
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al obtener el usuario por email');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getDegree = async () => {
    try {
        const { url, config } = httpRequestFactory.createRequest('/management/degree');
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al obtener la gestión actual');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const deleteManagement = async (id: number) => {
    try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            throw new Error('Usuario no autenticado');
        }
        
        const { url, config } = httpRequestFactory.createRequest(`/management/${id}`, 'DELETE', {
            deleted_by: currentUserId
        });
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al eliminar la gestión');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const cloneManagement = async (managementData: any) => {
    console.log('Management Data:', managementData);
    try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            throw new Error('Usuario no autenticado');
        }
        
        const { url, config } = httpRequestFactory.createRequest('/management/clone', 'POST', {
            ...managementData,
            created_by: currentUserId
        });
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al cargar los detalles de la gestion anterior');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};
