import { httpRequestFactory } from './HttpRequestFactory';

export const getManagementNow = async () => {
    try {
        const { url, config } = httpRequestFactory.createRequest('/managements');
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
        const { url, config } = httpRequestFactory.createRequest('/managements', 'POST', managementData);
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
        const { url, config } = httpRequestFactory.createRequest('/managements/year');
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al obtener las gestiones');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const deleteManagement = async (id: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(`/managements/${id}`, 'DELETE');
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error al eliminar la gestión');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};
