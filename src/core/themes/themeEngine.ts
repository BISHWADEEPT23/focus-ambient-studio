import { ThemeConfig } from '../../types';

export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: 'twilight-glow',
    name: 'Twilight Glow',
    category: 'ambient-canvas',
    overlayOpacity: 0.35,
    blurAmount: 0,
    sceneType: 'aurora',
  },
  {
    id: 'deep-forest',
    name: 'Emerald Forest',
    category: 'ambient-canvas',
    overlayOpacity: 0.4,
    blurAmount: 0,
    sceneType: 'particles',
  },
  {
    id: 'rainy-window',
    name: 'Rainy Window',
    category: 'ambient-canvas',
    overlayOpacity: 0.3,
    blurAmount: 0,
    sceneType: 'rain',
  },
  {
    id: 'starry-cosmos',
    name: 'Starry Cosmos',
    category: 'ambient-canvas',
    overlayOpacity: 0.25,
    blurAmount: 0,
    sceneType: 'stars',
  },
  {
    id: 'minimal-warmth',
    name: 'Minimal Warmth',
    category: 'minimal',
    overlayOpacity: 0.1,
    blurAmount: 0,
  },
  {
    id: 'cyber-focus',
    name: 'Obsidian Violet',
    category: 'gradient',
    overlayOpacity: 0.2,
    blurAmount: 0,
  },
];

export class ThemeEngine {
  private currentTheme: ThemeConfig;
  private isReducedMotion: boolean = false;

  constructor(initialTheme?: ThemeConfig) {
    this.currentTheme = initialTheme ?? PRESET_THEMES[0];
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
      });
    }
  }

  public getTheme(): ThemeConfig {
    return { ...this.currentTheme };
  }

  public setTheme(themeId: string): ThemeConfig {
    const found = PRESET_THEMES.find((t) => t.id === themeId);
    if (found) {
      this.currentTheme = { ...found };
    }
    return this.getTheme();
  }

  public setOverlayOpacity(opacity: number): void {
    this.currentTheme.overlayOpacity = Math.max(0, Math.min(0.9, opacity));
  }

  public setBlurAmount(blur: number): void {
    this.currentTheme.blurAmount = Math.max(0, Math.min(20, blur));
  }

  public getBackgroundStyle(): { background: string } {
    switch (this.currentTheme.id) {
      case 'twilight-glow':
        return { background: 'radial-gradient(ellipse at bottom, #1e1035 0%, #0c0714 60%, #050308 100%)' };
      case 'deep-forest':
        return { background: 'radial-gradient(ellipse at bottom, #0a2118 0%, #04100c 60%, #010504 100%)' };
      case 'rainy-window':
        return { background: 'radial-gradient(ellipse at top, #111e2e 0%, #080f18 60%, #03060a 100%)' };
      case 'starry-cosmos':
        return { background: 'radial-gradient(ellipse at center, #0d1322 0%, #070913 60%, #020308 100%)' };
      case 'minimal-warmth':
        return { background: 'linear-gradient(135deg, #181512 0%, #0f0d0b 100%)' };
      case 'cyber-focus':
        return { background: 'radial-gradient(circle at 50% 20%, #2e1065 0%, #0f0728 50%, #030014 100%)' };
      default:
        return { background: '#0a0a0f' };
    }
  }

  public shouldRenderCanvas(): boolean {
    return !this.isReducedMotion && this.currentTheme.category === 'ambient-canvas';
  }
}
