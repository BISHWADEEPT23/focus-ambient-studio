/**
 * DesktopBridge.ts
 * Cross-platform desktop bridge adapter for Electron and Tauri runtimes.
 * Manages native window frames, global media keys, and system tray notifications.
 */

import { IntegrationEventBus, integrationBus } from '../../core/contracts/integrationContracts';

export type DesktopRuntimeEnvironment = 'tauri' | 'electron' | 'browser';

export type WindowFrameAction =
  | 'minimize'
  | 'maximize'
  | 'unmaximize'
  | 'toggle_maximize'
  | 'close'
  | 'set_always_on_top'
  | 'set_fullscreen';

export type MediaKeyAction =
  | 'play'
  | 'pause'
  | 'play_pause'
  | 'stop'
  | 'next_track'
  | 'prev_track'
  | 'volume_mute'
  | 'volume_up'
  | 'volume_down';

export interface DesktopNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  tag?: string;
}

export interface TrayMenuItem {
  id: string;
  label: string;
  type?: 'normal' | 'separator' | 'checkbox';
  checked?: boolean;
  enabled?: boolean;
  onClick?: () => void;
}

export interface TrayConfig {
  title?: string;
  tooltip?: string;
  icon?: string;
  badgeCount?: number;
  menu?: TrayMenuItem[];
}

export interface IDesktopBridge {
  getEnvironment(): DesktopRuntimeEnvironment;
  minimizeWindow(): Promise<boolean>;
  maximizeWindow(): Promise<boolean>;
  toggleMaximizeWindow(): Promise<boolean>;
  closeWindow(): Promise<boolean>;
  setAlwaysOnTop(alwaysOnTop: boolean): Promise<boolean>;
  isAlwaysOnTop(): Promise<boolean>;
  setFullscreen(fullscreen: boolean): Promise<boolean>;
  isFullscreen(): Promise<boolean>;
  sendNotification(options: DesktopNotificationOptions): Promise<boolean>;
  updateTray(config: TrayConfig): Promise<boolean>;
  registerMediaKeyHandler(action: MediaKeyAction, callback: () => void): () => void;
  triggerMediaKey(action: MediaKeyAction): void;
  destroy(): void;
}

export class DesktopBridgeAdapter implements IDesktopBridge {
  private static instance?: DesktopBridgeAdapter;
  private alwaysOnTopState = false;
  private fullscreenState = false;
  private mediaKeyHandlers: Map<MediaKeyAction, Set<() => void>> = new Map();
  private keydownListener?: (event: KeyboardEvent) => void;
  private bus: IntegrationEventBus;
  private activeTrayConfig?: TrayConfig;

  constructor(bus: IntegrationEventBus = integrationBus) {
    this.bus = bus;
    this.setupMediaKeyListeners();
    this.setupMediaSessionHandlers();
  }

  public static getInstance(): DesktopBridgeAdapter {
    if (!DesktopBridgeAdapter.instance) {
      DesktopBridgeAdapter.instance = new DesktopBridgeAdapter();
    }
    return DesktopBridgeAdapter.instance;
  }

  /**
   * Detects active desktop runtime environment
   */
  public getEnvironment(): DesktopRuntimeEnvironment {
    if (typeof window === 'undefined') {
      return 'browser';
    }

    // Tauri runtime indicators
    if ('__TAURI__' in window || '__TAURI_INTERNALS__' in window) {
      return 'tauri';
    }

    // Electron runtime indicators
    if (
      'electron' in window ||
      (window as any).process?.type === 'renderer' ||
      (window as any).ipcRenderer
    ) {
      return 'electron';
    }

    return 'browser';
  }

  /**
   * Minimizes desktop window
   */
  public async minimizeWindow(): Promise<boolean> {
    const env = this.getEnvironment();
    this.emitBusWindowEvent('WINDOW_MINIMIZE');

    if (env === 'tauri') {
      const tauri = (window as any).__TAURI__;
      if (tauri?.window?.appWindow?.minimize) {
        await tauri.window.appWindow.minimize();
        return true;
      }
    } else if (env === 'electron') {
      const electron = (window as any).electron || (window as any).ipcRenderer;
      if (electron?.send) {
        electron.send('window-minimize');
        return true;
      }
    }

    return true; // Graceful mock fallback
  }

  /**
   * Maximizes desktop window
   */
  public async maximizeWindow(): Promise<boolean> {
    const env = this.getEnvironment();
    this.emitBusWindowEvent('WINDOW_MAXIMIZE');

    if (env === 'tauri') {
      const tauri = (window as any).__TAURI__;
      if (tauri?.window?.appWindow?.maximize) {
        await tauri.window.appWindow.maximize();
        return true;
      }
    } else if (env === 'electron') {
      const electron = (window as any).electron || (window as any).ipcRenderer;
      if (electron?.send) {
        electron.send('window-maximize');
        return true;
      }
    }

    return true;
  }

  /**
   * Toggles window maximized state
   */
  public async toggleMaximizeWindow(): Promise<boolean> {
    const env = this.getEnvironment();

    if (env === 'tauri') {
      const tauri = (window as any).__TAURI__;
      if (tauri?.window?.appWindow?.toggleMaximize) {
        await tauri.window.appWindow.toggleMaximize();
        return true;
      }
    } else if (env === 'electron') {
      const electron = (window as any).electron || (window as any).ipcRenderer;
      if (electron?.send) {
        electron.send('window-toggle-maximize');
        return true;
      }
    }

    return true;
  }

  /**
   * Closes the desktop application window
   */
  public async closeWindow(): Promise<boolean> {
    const env = this.getEnvironment();
    this.emitBusWindowEvent('WINDOW_CLOSE');

    if (env === 'tauri') {
      const tauri = (window as any).__TAURI__;
      if (tauri?.window?.appWindow?.close) {
        await tauri.window.appWindow.close();
        return true;
      }
    } else if (env === 'electron') {
      const electron = (window as any).electron || (window as any).ipcRenderer;
      if (electron?.send) {
        electron.send('window-close');
        return true;
      }
    }

    return true;
  }

  /**
   * Pins window always on top
   */
  public async setAlwaysOnTop(alwaysOnTop: boolean): Promise<boolean> {
    this.alwaysOnTopState = alwaysOnTop;
    const env = this.getEnvironment();

    this.bus.subscribe('DESKTOP_TAURI', () => {}); // ensure channel init
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('flocus_desktop_window', {
          detail: { event: 'SET_ALWAYS_ON_TOP', alwaysOnTop },
        })
      );
    }

    if (env === 'tauri') {
      const tauri = (window as any).__TAURI__;
      if (tauri?.window?.appWindow?.setAlwaysOnTop) {
        await tauri.window.appWindow.setAlwaysOnTop(alwaysOnTop);
        return true;
      }
    } else if (env === 'electron') {
      const electron = (window as any).electron || (window as any).ipcRenderer;
      if (electron?.send) {
        electron.send('window-set-always-on-top', alwaysOnTop);
        return true;
      }
    }

    return true;
  }

  public async isAlwaysOnTop(): Promise<boolean> {
    return this.alwaysOnTopState;
  }

  public async setFullscreen(fullscreen: boolean): Promise<boolean> {
    this.fullscreenState = fullscreen;
    const env = this.getEnvironment();

    if (env === 'tauri') {
      const tauri = (window as any).__TAURI__;
      if (tauri?.window?.appWindow?.setFullscreen) {
        await tauri.window.appWindow.setFullscreen(fullscreen);
        return true;
      }
    } else if (env === 'electron') {
      const electron = (window as any).electron || (window as any).ipcRenderer;
      if (electron?.send) {
        electron.send('window-set-fullscreen', fullscreen);
        return true;
      }
    } else if (typeof document !== 'undefined') {
      if (fullscreen && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      } else if (!fullscreen && document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    }

    return true;
  }

  public async isFullscreen(): Promise<boolean> {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      return true;
    }
    return this.fullscreenState;
  }

  /**
   * Sends desktop tray / OS notification
   */
  public async sendNotification(options: DesktopNotificationOptions): Promise<boolean> {
    const env = this.getEnvironment();

    if (env === 'tauri') {
      const tauri = (window as any).__TAURI__;
      if (tauri?.notification?.sendNotification) {
        tauri.notification.sendNotification({
          title: options.title,
          body: options.body,
          icon: options.icon,
        });
        return true;
      }
    } else if (env === 'electron') {
      const electron = (window as any).electron || (window as any).ipcRenderer;
      if (electron?.send) {
        electron.send('show-notification', options);
        return true;
      }
    }

    // Standard HTML5 Notification API fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          tag: options.tag,
          silent: options.silent,
        });
        return true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(options.title, {
            body: options.body,
            icon: options.icon,
            tag: options.tag,
            silent: options.silent,
          });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Updates desktop system tray configuration
   */
  public async updateTray(config: TrayConfig): Promise<boolean> {
    this.activeTrayConfig = { ...this.activeTrayConfig, ...config };
    const env = this.getEnvironment();

    if (env === 'tauri') {
      const tauri = (window as any).__TAURI__;
      if (tauri?.tray?.setTooltip && config.tooltip) {
        await tauri.tray.setTooltip(config.tooltip);
      }
      return true;
    } else if (env === 'electron') {
      const electron = (window as any).electron || (window as any).ipcRenderer;
      if (electron?.send) {
        electron.send('update-tray', config);
        return true;
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('flocus_tray_update', { detail: this.activeTrayConfig })
      );
    }

    return true;
  }

  public getActiveTrayConfig(): TrayConfig | undefined {
    return this.activeTrayConfig;
  }

  /**
   * Registers callback for specific media key actions
   */
  public registerMediaKeyHandler(action: MediaKeyAction, callback: () => void): () => void {
    if (!this.mediaKeyHandlers.has(action)) {
      this.mediaKeyHandlers.set(action, new Set());
    }
    this.mediaKeyHandlers.get(action)!.add(callback);

    return () => {
      this.mediaKeyHandlers.get(action)?.delete(callback);
    };
  }

  /**
   * Triggers registered media key handlers
   */
  public triggerMediaKey(action: MediaKeyAction): void {
    const handlers = this.mediaKeyHandlers.get(action);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler();
        } catch (err) {
          console.error(`Error executing media key handler for ${action}:`, err);
        }
      }
    }
  }

  /**
   * Maps physical media key events to registered actions
   */
  private setupMediaKeyListeners(): void {
    if (typeof window === 'undefined') return;

    this.keydownListener = (event: KeyboardEvent) => {
      switch (event.code || event.key) {
        case 'MediaPlayPause':
          this.triggerMediaKey('play_pause');
          break;
        case 'MediaStop':
          this.triggerMediaKey('stop');
          break;
        case 'MediaTrackNext':
          this.triggerMediaKey('next_track');
          break;
        case 'MediaTrackPrevious':
          this.triggerMediaKey('prev_track');
          break;
        case 'AudioVolumeMute':
          this.triggerMediaKey('volume_mute');
          break;
        case 'AudioVolumeUp':
          this.triggerMediaKey('volume_up');
          break;
        case 'AudioVolumeDown':
          this.triggerMediaKey('volume_down');
          break;
      }
    };

    window.addEventListener('keydown', this.keydownListener);
  }

  /**
   * Configures Web MediaSession API actions
   */
  private setupMediaSessionHandlers(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    try {
      navigator.mediaSession.setActionHandler('play', () => this.triggerMediaKey('play'));
      navigator.mediaSession.setActionHandler('pause', () => this.triggerMediaKey('pause'));
      navigator.mediaSession.setActionHandler('stop', () => this.triggerMediaKey('stop'));
      navigator.mediaSession.setActionHandler('nexttrack', () => this.triggerMediaKey('next_track'));
      navigator.mediaSession.setActionHandler('previoustrack', () => this.triggerMediaKey('prev_track'));
    } catch (e) {
      // Some browsers / environments may throw for certain action handlers
    }
  }

  private emitBusWindowEvent(event: 'WINDOW_MINIMIZE' | 'WINDOW_MAXIMIZE' | 'WINDOW_CLOSE'): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flocus_desktop_window', { detail: { event } }));
    }
  }

  public destroy(): void {
    this.mediaKeyHandlers.clear();

    if (typeof window !== 'undefined' && this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = undefined;
    }
  }
}

export const desktopBridge = DesktopBridgeAdapter.getInstance();
