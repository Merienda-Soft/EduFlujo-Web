import { httpRequestFactory } from './HttpRequestFactory';
import { getCurrentUserId } from './globalState';

export const createNotification = async (notificationData) => {
    try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            throw new Error('Usuario no autenticado');
        }
        
        const { url, config } = httpRequestFactory.createRequest('/notifications', 'POST', {
            ...notificationData,
            created_by: currentUserId
        });
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al crear la notificación: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getNotificationsByPersonId = async (personId: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(`/notifications/person/${personId}`);
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al obtener las notificaciones: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getUnreadNotificationsCount = async (personId: string) => {
    try {
        const { url, config } = httpRequestFactory.createRequest(`/notifications/unread/${personId}`);
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al obtener el contador de notificaciones: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const updateNotificationStatus = async (notificationId: string, status: number) => {
    try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            throw new Error('Usuario no autenticado');
        }
        
        const { url, config } = httpRequestFactory.createRequest(
            `/notifications/${notificationId}/status`,
            'PUT',
            { 
                status,
                updated_by: currentUserId
            }
        );
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Error al actualizar el estado de la notificación: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getNotificationsByPerson = async (email: string) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/notifications/person/${email}`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error fetching notifications');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error in getNotificationsByPerson:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    const { url, config } = httpRequestFactory.createRequest(`/notifications/${notificationId}/read`);
    const response = await fetch(url, config);
    if (!response.ok) throw new Error('Error marking notification as read');
    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    throw error;
  }
}; 