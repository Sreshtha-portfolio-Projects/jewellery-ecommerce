// Firebase Cloud Messaging Web Push Notification Helper

let messaging = null;

export const initializePushNotifications = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    if (!firebaseConfig.apiKey) {
      console.warn('Firebase config not found. Push notifications disabled.');
      return null;
    }

    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    return messaging;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const registerPushToken = async () => {
  try {
    if (!messaging) {
      messaging = await initializePushNotifications();
    }

    if (!messaging) {
      return null;
    }

    const { getToken } = await import('firebase/messaging');
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    const token = await getToken(messaging, { vapidKey });

    if (token) {
      const deviceInfo = {
        device: navigator.platform || 'Unknown',
        browser: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'Unknown',
        os: navigator.platform || 'Unknown'
      };

      const apiToken = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
      }

      await fetch(`${import.meta.env.VITE_API_URL}/api/push/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          token,
          ...deviceInfo
        })
      });

      return token;
    }

    return null;
  } catch (error) {
    console.error('Error registering push token:', error);
    return null;
  }
};

export const unregisterPushToken = async (token) => {
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/api/push/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
  } catch (error) {
    console.error('Error unregistering push token:', error);
  }
};

export const setupPushNotificationListener = async () => {
  try {
    if (!messaging) {
      messaging = await initializePushNotifications();
    }

    if (!messaging) {
      return;
    }

    const { onMessage } = await import('firebase/messaging');

    onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);

      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/logo.png',
        image: payload.notification?.image,
        data: payload.data
      };

      if (Notification.permission === 'granted') {
        const notification = new Notification(notificationTitle, notificationOptions);

        notification.onclick = (event) => {
          event.preventDefault();
          if (payload.data?.url) {
            window.open(payload.data.url, '_blank');
          }
          notification.close();
        };
      }
    });
  } catch (error) {
    console.error('Error setting up push notification listener:', error);
  }
};
