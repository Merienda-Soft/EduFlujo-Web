import { httpRequestFactory } from './HttpRequestFactory';

export const getCentralizadorReport = async (courseId: string, managementId: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(
            `/reports/centralizador/course/${courseId}/management/${managementId}`
        );
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al obtener el centralizador: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Error al obtener el centralizador');
        }

        // Función auxiliar para abrir enlace de descarga
        const openDownloadLink = (url: string) => {
            window.open(url, '_blank');
        };

        // Manejar la respuesta del centralizador
        if (data.downloadURL) {
            openDownloadLink(data.downloadURL);
        }
        
        return { success: true, data: data };
    } catch (error) {
        console.error('Error en getCentralizadorReport:', error);
        throw error;
    }
};

export const getBoletinesReport = async (courseId: string, managementId: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(
            `/reports/boletines/course/${courseId}/management/${managementId}`
        );
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al obtener los boletines: ${response.status}`);
        }

        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.error || 'Error al obtener los boletines');
        }

        // Función auxiliar para abrir enlace de descarga
        const openDownloadLink = (url: string) => {
            window.open(url, '_blank');
        };

        const { boletines } = data;
        if (!boletines || !Array.isArray(boletines)) {
            throw new Error('No se recibieron los boletines correctamente');
        }

        // Abrir todos los enlaces de descarga con delay
        boletines.forEach((boletin, index) => {
            if (boletin.downloadUrl) {
                setTimeout(() => {
                    openDownloadLink(boletin.downloadUrl);
                }, index * 1000); // 1 segundo de delay entre cada descarga
            }
        });
        
        return { success: true, data: data };
    } catch (error) {
        console.error('Error en getBoletinesReport:', error);
        throw error;
    }
};