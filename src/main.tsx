import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient.ts';
import App from './App.tsx';
import './index.css';

// Detect if running inside Android APK wrapper / WebView / standalone app with notch
if (typeof window !== 'undefined') {
  try {
    const ua = navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);
    const isWebView = /wv|Version\/[0-9.]+/i.test(ua) || (window as unknown as { Android?: unknown }).Android !== undefined;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (isAndroid && (isWebView || isStandalone)) {
      document.documentElement.classList.add('is-mobile-apk');
    }
  } catch {
    // Ignore in unsupported environments
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);


