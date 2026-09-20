/**
 * OneSignal Service
 * Bridges Google AI Studio (React App), Supabase, and OneSignal Push Notifications for mobile & web.
 */

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignal?: any;
    median?: any;
    gonative?: any;
  }
}

const ONESIGNAL_APP_ID_KEY = 'pinin_onesignal_app_id';
const ONESIGNAL_REST_API_KEY_STORAGE = 'pinin_onesignal_rest_api_key';

// Default App ID from env or saved configuration
export function getOneSignalAppId(): string {
  const envAppId = (import.meta as any).env?.VITE_ONESIGNAL_APP_ID;
  if (envAppId && envAppId.trim()) return envAppId.trim();
  try {
    const saved = localStorage.getItem(ONESIGNAL_APP_ID_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return '';
}

export function getOneSignalRestApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_ONESIGNAL_REST_API_KEY;
  if (envKey && envKey.trim()) return envKey.trim();
  try {
    const saved = localStorage.getItem(ONESIGNAL_REST_API_KEY_STORAGE);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return '';
}

export function saveOneSignalConfig(appId: string, restApiKey?: string) {
  try {
    if (appId) localStorage.setItem(ONESIGNAL_APP_ID_KEY, appId.trim());
    if (restApiKey) localStorage.setItem(ONESIGNAL_REST_API_KEY_STORAGE, restApiKey.trim());
  } catch {}
}

let isInitialized = false;
let isScriptLoading = false;

/**
 * Dynamically load the OneSignal Web SDK script safely
 */
function loadOneSignalScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.OneSignal || isInitialized) {
      resolve(true);
      return;
    }

    const existing = document.querySelector('script[src*="OneSignalSDK"]');
    if (existing) {
      resolve(true);
      return;
    }

    if (isScriptLoading) {
      const checkInterval = setInterval(() => {
        if (window.OneSignal || !isScriptLoading) {
          clearInterval(checkInterval);
          resolve(Boolean(window.OneSignal));
        }
      }, 100);
      return;
    }

    isScriptLoading = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.async = true;
    script.onload = () => {
      isScriptLoading = false;
      resolve(true);
    };
    script.onerror = () => {
      isScriptLoading = false;
      console.warn('OneSignal SDK script could not be loaded.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize OneSignal Web SDK
 */
export async function initOneSignal(customAppId?: string): Promise<boolean> {
  const appId = customAppId || getOneSignalAppId();

  if (!appId) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  // Inside sandboxed iframes (like AI Studio preview), Web Push service workers and
  // user sync endpoints are blocked by browser cross-origin sandbox policies.
  // We avoid initializing service workers inside iframes to prevent timeout errors.
  if (isInsideIframe()) {
    return false;
  }

  if (isInitialized && window.OneSignal) {
    return true;
  }

  await loadOneSignalScript();

  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' },
        });
        isInitialized = true;
        resolve(true);
      } catch (err) {
        // Silently catch to prevent unhandled promise / timeout spam
        resolve(false);
      }
    });
  });
}

/**
 * Associate the logged in user with OneSignal so Supabase & server can target this specific device/user
 */
export async function loginUserToOneSignal(userId: string, email?: string, name?: string) {
  if (!userId) return;
  const appId = getOneSignalAppId();
  if (!appId) return;

  // Skip inside sandboxed iframes to prevent network fetch timeouts
  if (isInsideIframe()) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (typeof OneSignal?.login === 'function') {
        await OneSignal.login(userId);
        if (email && typeof OneSignal.User?.addEmail === 'function') {
          try {
            await OneSignal.User.addEmail(email);
          } catch {}
        }
        if (name && typeof OneSignal.User?.addTag === 'function') {
          try {
            await OneSignal.User.addTag('name', name);
          } catch {}
        }
      }
    } catch {}
  });
}

/**
 * Logout user from OneSignal
 */
export function logoutUserFromOneSignal() {
  if (isInsideIframe()) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (typeof OneSignal?.logout === 'function') {
        await OneSignal.logout();
      }
    } catch {}
  });
}

/**
 * Check if notifications are permanently blocked in browser settings
 */
export function isNotificationBlocked(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'denied';
}

/**
 * Check if the application is currently running inside an iframe (like AI Studio preview)
 */
export function isInsideIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Request Push Notification Permission on Mobile or Desktop Browser
 */
export async function requestPushPermission(): Promise<{
  granted: boolean;
  blocked: boolean;
  insideIframe: boolean;
  status: 'granted' | 'denied' | 'default' | 'iframe_restricted' | 'missing_app_id';
}> {
  const appId = getOneSignalAppId();
  const inIframe = isInsideIframe();

  if (!appId) {
    return {
      granted: false,
      blocked: false,
      insideIframe: inIframe,
      status: 'missing_app_id',
    };
  }

  const alreadyBlocked = isNotificationBlocked();
  if (alreadyBlocked) {
    return {
      granted: false,
      blocked: true,
      insideIframe: inIframe,
      status: 'denied',
    };
  }

  // 0. If running inside a Median.co / GoNative native app wrapper:
  if (typeof window !== 'undefined') {
    if (window.median?.onesignal?.register) {
      try {
        window.median.onesignal.register();
        return { granted: true, blocked: false, insideIframe: false, status: 'granted' };
      } catch (e) {
        console.warn('Median onesignal register error:', e);
      }
    }
    if (window.gonative?.onesignal?.register) {
      try {
        window.gonative.onesignal.register();
        return { granted: true, blocked: false, insideIframe: false, status: 'granted' };
      } catch (e) {
        console.warn('GoNative onesignal register error:', e);
      }
    }
  }

  // 1. Try native Notification.requestPermission first if available directly
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        return {
          granted: true,
          blocked: false,
          insideIframe: inIframe,
          status: 'granted',
        };
      }

      // Inside iframes, browsers often throw a SecurityError or silently block requestPermission
      if (!inIframe) {
        const nativePerm = await Notification.requestPermission();
        if (nativePerm === 'granted') {
          await initOneSignal(appId);
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async (OneSignal: any) => {
            try {
              await OneSignal.Notifications?.requestPermission();
            } catch {}
          });
          return {
            granted: true,
            blocked: false,
            insideIframe: inIframe,
            status: 'granted',
          };
        } else if (nativePerm === 'denied') {
          return {
            granted: false,
            blocked: true,
            insideIframe: inIframe,
            status: 'denied',
          };
        }
      }
    } catch (e) {
      console.warn('Native notification request error:', e);
    }
  }

  if (inIframe) {
    return {
      granted: false,
      blocked: false,
      insideIframe: true,
      status: 'iframe_restricted',
    };
  }

  // Ensure OneSignal is initialized outside iframe
  await initOneSignal(appId);

  // 2. Try OneSignal's SDK Permission requester
  return new Promise((resolve) => {
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          const permission = await OneSignal.Notifications?.requestPermission();
          const isGranted =
            permission === true ||
            permission === 'granted' ||
            (typeof Notification !== 'undefined' && Notification.permission === 'granted');
          const isDenied =
            permission === 'denied' ||
            (typeof Notification !== 'undefined' && Notification.permission === 'denied');

          resolve({
            granted: isGranted,
            blocked: isDenied,
            insideIframe: inIframe,
            status: isGranted ? 'granted' : isDenied ? 'denied' : 'default',
          });
        } catch {
          const fallback = typeof Notification !== 'undefined' && Notification.permission === 'granted';
          const isDenied = typeof Notification !== 'undefined' && Notification.permission === 'denied';
          resolve({
            granted: fallback,
            blocked: isDenied,
            insideIframe: inIframe,
            status: fallback ? 'granted' : isDenied ? 'denied' : 'default',
          });
        }
      });
    } catch {
      resolve({
        granted: false,
        blocked: isNotificationBlocked(),
        insideIframe: inIframe,
        status: 'default',
      });
    }
  });
}

/**
 * Check if Push Notifications are currently permitted
 */
export async function checkPushPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      resolve(false);
      return;
    }
    if (Notification.permission === 'granted') {
      resolve(true);
      return;
    }

    if (isInsideIframe()) {
      resolve(false);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        const canSend = OneSignal.Notifications?.permission;
        resolve(canSend === true || canSend === 'granted');
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Sends a push notification to OneSignal's REST API with timeout
 * (Can target a specific user by external user ID or broadcast to all registered devices)
 */
export async function sendOneSignalPushNotification(payload: {
  userId?: string | null;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  const appId = getOneSignalAppId();
  const restApiKey = getOneSignalRestApiKey();

  if (!appId) {
    return { success: false, error: 'OneSignal App ID not configured' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const body: Record<string, any> = {
      app_id: appId,
      headings: { en: payload.title },
      contents: { en: payload.message },
      url: payload.url || (typeof window !== 'undefined' ? window.location.origin : undefined),
      data: payload.data || {},
    };

    // If specific user ID is given, target by external_id, else broadcast to all subscriptions
    if (payload.userId && payload.userId !== 'all' && payload.userId !== 'broadcast') {
      body.include_aliases = {
        external_id: [payload.userId],
      };
      body.target_channel = 'push';
    } else {
      body.included_segments = ['Total Subscriptions'];
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (restApiKey) {
      headers['Authorization'] = `Basic ${restApiKey}`;
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data?.errors?.[0] || 'Failed to send OneSignal push' };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { success: false, error: err?.name === 'AbortError' ? 'Network timeout' : err?.message || 'Network error' };
  }
}
