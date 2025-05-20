import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useUser } from '@auth0/nextjs-auth0/client';
import { httpRequestFactory } from '../utils/HttpRequestFactory';

interface Notification {
  id: number;
  message: string;
  created_date: string;
  id_person_from: number;
  id_person_to: number;
  status: number;
  updated_at: string;
}

interface NotificationResponse {
  success: boolean;
  data: {
    data: Notification[];
  };
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.email) {
        console.log('No user email found');
        return;
      }
      try {
        const { url, config } = httpRequestFactory.createRequest(`/notifications/person/email/${user.email}`);
        const response = await fetch(url, config);
        if (!response.ok) throw new Error('Error fetching notifications');
        const responseData: NotificationResponse = await response.json();
        console.log('Response data:', responseData);
        
        if (responseData.success && responseData.data?.data) {
          setNotifications(responseData.data.data);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };

    fetchNotifications();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No hay notificaciones
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200">{notification.message}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notification.created_date).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 