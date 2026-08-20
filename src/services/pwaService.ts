// PWA Service for installation, offline detection, and service worker registration

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled: boolean = false;
  private listeners: Set<(canInstall: boolean) => void> = new Set();

  constructor() {
    this.checkIfInstalled();
    this.initInstallListener();
  }

  public registerServiceWorker(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);

            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New content is available; please refresh.');
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn('[PWA] Service Worker registration failed:', error);
          });
      });
    }
  }

  private checkIfInstalled(): void {
    if (typeof window === 'undefined') return;

    // Check if running standalone (Android/Desktop PWA or iOS standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    this.isInstalled = isStandalone || isIOSStandalone;
  }

  private initInstallListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevent default mini-infobar from appearing on mobile
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyListeners(true);
      console.log('[PWA] beforeinstallprompt event captured');
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.notifyListeners(false);
      console.log('[PWA] App successfully installed!');
    });
  }

  public canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  public getIsInstalled(): boolean {
    return this.isInstalled;
  }

  public subscribe(callback: (canInstall: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.canInstall());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(canInstall: boolean): void {
    this.listeners.forEach((callback) => callback(canInstall));
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        this.isInstalled = true;
        this.deferredPrompt = null;
        this.notifyListeners(false);
        return true;
      }
    } catch (err) {
      console.error('[PWA] Prompt error:', err);
    }
    return false;
  }

  public isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
  }
}

export const pwaService = new PWAManager();
