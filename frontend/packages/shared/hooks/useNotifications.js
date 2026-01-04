/**
 * useNotifications Hook
 * Manages Firebase Cloud Messaging (FCM) push notifications
 */

import { useEffect, useState } from 'react';
import { requestNotificationPermission, onForegroundMessage, registerTokenWithBackend } from '../utils/firebaseConfig';

export const useNotifications = () => {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [fcmToken, setFcmToken] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Request permission and register token
    const initializeNotifications = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        await registerTokenWithBackend(token);
      }
    };

    initializeNotifications();

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      setLastNotification(payload);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '../../../icons/icon_192.png',
          badge: '../../../icons/icon_96.png',
          data: payload.data
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const requestPermission = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setFcmToken(token);
      setNotificationPermission('granted');
      await registerTokenWithBackend(token);
      return true;
    }
    return false;
  };

  return {
    notificationPermission,
    fcmToken,
    lastNotification,
    requestPermission,
    isSupported: 'Notification' in window
  };
};
