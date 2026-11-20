/**
 * registerServiceWorker.ts
 * Registers and manages the offline-first Service Worker for Focus & Ambient Studio.
 */

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  // Register in production or when supported
  return navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[Flocus PWA] New version available; will activate on next reload.');
              } else {
                console.log('[Flocus PWA] Content is cached for offline use.');
              }
            }
          };
        }
      };
      return registration;
    })
    .catch((error) => {
      console.warn('[Flocus PWA] Service Worker registration failed:', error);
      return null;
    });
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return navigator.serviceWorker.ready.then((registration) => {
    return registration.unregister();
  });
}
