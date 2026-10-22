import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const HAS_REQUESTED_PERMISSIONS_KEY = 'hasRequestedPermissions';

/**
 * Checks if location permission is granted
 */
export async function checkLocationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isPluginAvailable('Geolocation')) {
      const status = await Geolocation.checkPermissions();
      return status.location === 'granted';
    }
  } catch (e) {
    console.warn('[Permissions] checkLocationPermission error:', e);
  }
  return false;
}

/**
 * Requests location permission with try/catch and pre-check
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isPluginAvailable('Geolocation')) {
      // 1. Check if already granted before requesting
      try {
        const checkStatus = await Geolocation.checkPermissions();
        if (checkStatus.location === 'granted') {
          return true;
        }
      } catch (checkErr) {
        console.warn('[Permissions] Geolocation.checkPermissions warning:', checkErr);
      }

      // 2. Request permission safely
      const reqStatus = await Geolocation.requestPermissions();
      return reqStatus.location === 'granted';
    }
  } catch (e) {
    console.warn('[Permissions] Geolocation.requestPermissions error:', e);
  }
  return false;
}

/**
 * Checks if camera permission is granted
 */
export async function checkCameraPermission(): Promise<boolean> {
  try {
    if (Capacitor.isPluginAvailable('Camera')) {
      const status = await Camera.checkPermissions();
      return status.camera === 'granted';
    }
  } catch (e) {
    console.warn('[Permissions] checkCameraPermission error:', e);
  }
  return false;
}

/**
 * Requests camera permission with try/catch and pre-check
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    if (Capacitor.isPluginAvailable('Camera')) {
      // 1. Check if already granted before requesting
      try {
        const checkStatus = await Camera.checkPermissions();
        if (checkStatus.camera === 'granted') {
          return true;
        }
      } catch (checkErr) {
        console.warn('[Permissions] Camera.checkPermissions warning:', checkErr);
      }

      // 2. Request permission safely
      const reqStatus = await Camera.requestPermissions();
      return reqStatus.camera === 'granted';
    }
  } catch (e) {
    console.warn('[Permissions] Camera.requestPermissions error:', e);
  }
  return false;
}

/**
 * Checks if notification permission is granted
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isPluginAvailable('PushNotifications')) {
      const status = await PushNotifications.checkPermissions();
      return status.receive === 'granted';
    }
    if (typeof Notification !== 'undefined') {
      return Notification.permission === 'granted';
    }
  } catch (e) {
    console.warn('[Permissions] checkNotificationPermission error:', e);
  }
  return false;
}

/**
 * Requests notification permission with try/catch and pre-check
 * Fixes crash on Account page "Enable Notification" button
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // 1. Check if running on Capacitor with PushNotifications plugin available
    if (Capacitor.isPluginAvailable('PushNotifications')) {
      // Must check if permission is already granted before requesting
      try {
        const checkStatus = await PushNotifications.checkPermissions();
        if (checkStatus.receive === 'granted') {
          return true;
        }
      } catch (checkErr) {
        console.warn('[Permissions] PushNotifications.checkPermissions warning:', checkErr);
      }

      // Wrap requestPermissions in try/catch to prevent Android crash
      try {
        const reqStatus = await PushNotifications.requestPermissions();
        if (reqStatus.receive === 'granted') {
          try {
            await PushNotifications.register();
          } catch (regErr) {
            console.warn('[Permissions] PushNotifications.register optional warning:', regErr);
          }
          return true;
        }
        return false;
      } catch (reqErr) {
        console.error('[Permissions] PushNotifications.requestPermissions error:', reqErr);
        return false;
      }
    }

    // 2. Web fallback (OneSignal / browser Notification API)
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        return true;
      }
      if (Notification.permission !== 'denied' && typeof Notification.requestPermission === 'function') {
        try {
          const res = await Notification.requestPermission();
          return res === 'granted';
        } catch (e) {
          console.warn('[Permissions] Web Notification.requestPermission error:', e);
        }
      }
    }
  } catch (e) {
    console.error('[Permissions] requestNotificationPermission caught error:', e);
  }
  return false;
}

/**
 * Make permission popup show AUTOMATICALLY on first app open:
 * - Use localStorage flag 'hasRequestedPermissions' to check if first time
 * - If first time, auto request Location, Camera, and Notifications one after another with 800ms delay
 * - Do not show all at once
 */
export async function initFirstLaunchPermissions(): Promise<void> {
  try {
    const hasRequested = localStorage.getItem(HAS_REQUESTED_PERMISSIONS_KEY);
    if (hasRequested === 'true') {
      return;
    }

    // Mark as requested immediately to avoid race conditions or repeated calls
    localStorage.setItem(HAS_REQUESTED_PERMISSIONS_KEY, 'true');

    // Small delay to allow the app shell and window to mount smoothly
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 1. Request Location
    try {
      await requestLocationPermission();
    } catch (e) {
      console.warn('[Permissions Flow] Location error:', e);
    }

    // 800ms delay between prompts
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 2. Request Camera
    try {
      await requestCameraPermission();
    } catch (e) {
      console.warn('[Permissions Flow] Camera error:', e);
    }

    // 800ms delay between prompts
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 3. Request Push Notifications
    try {
      await requestNotificationPermission();
    } catch (e) {
      console.warn('[Permissions Flow] Push Notifications error:', e);
    }
  } catch (e) {
    console.warn('[Permissions Flow] initFirstLaunchPermissions error:', e);
  }
}
