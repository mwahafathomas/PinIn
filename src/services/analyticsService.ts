// Google Analytics & Cookie Consent Service for PinIn
// Supports Google Consent Mode v2, dynamic gtag.js loading, and visited page logging

export interface CookieConsentSettings {
  essential: boolean; // Always true (Session, Security, Auth, Fraud prevention)
  analytics: boolean; // Google Analytics 4, Page views, Click metrics
  personalization: boolean; // Location filters, Search preferences
  timestamp: string;
  hasChosen: boolean; // True once user has made an explicit choice
}

export interface VisitedPageRecord {
  path: string;
  title: string;
  timestamp: string;
  timeFormatted: string;
}

const COOKIE_CONSENT_KEY = 'pinin_cookie_consent';
const VISITED_PAGES_KEY = 'pinin_visited_pages_log';

// Default Google Analytics Measurement ID (configured via .env or user settings)
export const GA_MEASUREMENT_ID: string =
  ((import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string) || '';

// Check if running in standard website browser (Chrome, Google Search, Safari, Firefox, Edge)
// vs installed standalone app / PWA or in-app webview
export function isWebsiteBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Detect if running as installed standalone PWA / App mode
  const isStandaloneMatch =
    window.matchMedia &&
    window.matchMedia('(display-mode: standalone)').matches;
  const isNavigatorStandalone = (window.navigator as any).standalone === true;
  const isAndroidAppReferrer = document.referrer?.startsWith('android-app://');

  // 2. Check for app specific URL query parameter (?is_app=true or ?app_mode=true)
  const params = new URLSearchParams(window.location.search);
  const isAppParam = params.get('is_app') === 'true' || params.get('app_mode') === 'true';

  if (isStandaloneMatch || isNavigatorStandalone || isAndroidAppReferrer || isAppParam) {
    return false;
  }

  return true;
}

// Get saved cookie consent from localStorage
export function getSavedConsent(): CookieConsentSettings | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save cookie consent and trigger Google Analytics consent update
export function saveConsent(settings: {
  analytics: boolean;
  personalization?: boolean;
}): CookieConsentSettings {
  const fullConsent: CookieConsentSettings = {
    essential: true,
    analytics: Boolean(settings.analytics),
    personalization: settings.personalization ?? true,
    timestamp: new Date().toISOString(),
    hasChosen: true,
  };

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(fullConsent));
  } catch {}

  // Update Google Analytics Consent Mode
  updateGoogleConsentMode(fullConsent.analytics);

  // If analytics was revoked, we can retain or clear session history according to preference
  if (!fullConsent.analytics) {
    // Optionally stop tracking
  }

  return fullConsent;
}

// Accept All Cookies
export function acceptAllCookies(): CookieConsentSettings {
  return saveConsent({ analytics: true, personalization: true });
}

// Reject All Non-Essential Cookies
export function rejectAllCookies(): CookieConsentSettings {
  return saveConsent({ analytics: false, personalization: false });
}

// Check if first-time visitor pop-up should be displayed
export function shouldShowCookiePopup(): boolean {
  // Only show on web browser context (Chrome, Google, Safari, etc.), NOT in installed app
  if (!isWebsiteBrowser()) {
    return false;
  }

  const consent = getSavedConsent();
  // Show only if user hasn't made an explicit choice yet
  return !consent || !consent.hasChosen;
}

// Declare global window gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let isGtagScriptInjected = false;

// Initialize Google Analytics with default denied state (Google Consent Mode v2)
export function initGoogleAnalytics(customMeasurementId?: string) {
  if (typeof window === 'undefined') return;

  const gaId = customMeasurementId || GA_MEASUREMENT_ID;

  // Initialize dataLayer and gtag stub if not present
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  // 1. Google Consent Mode v2 - Default to denied until user accepts
  const savedConsent = getSavedConsent();
  const analyticsGranted = savedConsent?.analytics ? 'granted' : 'denied';
  const personalizationGranted = savedConsent?.personalization ? 'granted' : 'denied';

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: personalizationGranted,
    analytics_storage: analyticsGranted,
    functionality_storage: 'granted',
    personalization_storage: personalizationGranted,
    security_storage: 'granted',
    wait_for_update: 500,
  });

  // 2. Load gtag.js script if we have a measurement ID
  if (gaId && !isGtagScriptInjected) {
    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(script);
      isGtagScriptInjected = true;

      window.gtag('js', new Date());
      window.gtag('config', gaId, {
        send_page_view: false, // We manually send page_view on client route change
        anonymize_ip: true,
      });
    } catch (e) {
      console.warn('Google Analytics script load error:', e);
    }
  }
}

// Update Google Analytics consent mode dynamically when user accepts/rejects
export function updateGoogleConsentMode(analyticsGranted: boolean) {
  if (typeof window === 'undefined') return;

  const status = analyticsGranted ? 'granted' : 'denied';

  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: status,
      ad_storage: status,
      ad_user_data: status,
      ad_personalization: status,
    });
  }

  // If user accepted and script wasn't loaded yet, try loading it
  const gaId = GA_MEASUREMENT_ID;
  if (analyticsGranted && gaId && !isGtagScriptInjected) {
    initGoogleAnalytics(gaId);
  }
}

// Get history of visited pages recorded in session
export function getVisitedPagesLog(): VisitedPageRecord[] {
  try {
    const raw = sessionStorage.getItem(VISITED_PAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Record and send page view to Google Analytics & local log
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return;

  const consent = getSavedConsent();
  // Only track if analytics consent is granted
  if (!consent?.analytics) {
    return;
  }

  const pageTitle = title || document.title || 'PinIn';
  const timestamp = new Date().toISOString();
  const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Send page view to Google Analytics if configured
  if (window.gtag) {
    const gaId = GA_MEASUREMENT_ID;
    if (gaId) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: pageTitle,
        page_location: window.location.href,
      });
    }
  }

  // 2. Record to session visited pages log so users & admins can view which pages they visited
  try {
    const currentLog = getVisitedPagesLog();
    // Avoid immediate duplicate of same path within last entry
    if (currentLog.length > 0 && currentLog[0].path === path) {
      return;
    }
    const newRecord: VisitedPageRecord = {
      path,
      title: pageTitle,
      timestamp,
      timeFormatted,
    };
    const updated = [newRecord, ...currentLog].slice(0, 50); // keep last 50 visits
    sessionStorage.setItem(VISITED_PAGES_KEY, JSON.stringify(updated));

    // Dispatch custom event so preferences modal can live-update if open
    window.dispatchEvent(new CustomEvent('pinin_pageview_tracked', { detail: newRecord }));
  } catch {}
}

// Track custom user interactions in Google Analytics
export function trackAnalyticsEvent(eventName: string, params: Record<string, any> = {}) {
  const consent = getSavedConsent();
  if (!consent?.analytics) return;

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}
