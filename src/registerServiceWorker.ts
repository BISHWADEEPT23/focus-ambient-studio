/**
 * registerServiceWorker.ts
 * Registers and manages the offline-first Service Worker for Focus & Ambient Studio.
 */

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  // Determine dynamic base path for GitHub Pages and subpath deployment
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const swUrl = `${base}sw.js`;

  // Register with scope matching the deployed base URL
  return navigator.serviceWorker
    .register(swUrl, { scope: base })
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
