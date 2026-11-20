import { ThemeConfig, ThemePalette } from '../../types';

export const THEME_PALETTES: Record<string, ThemePalette> = {
  'twilight-glow': {
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryMuted: 'rgba(139, 92, 246, 0.18)',
    accent: '#a78bfa',
    surface: '#0d0b18',
    surfaceBorder: 'rgba(139, 92, 246, 0.25)',
    bgGradient: 'radial-gradient(ellipse at bottom, #1e1035 0%, #0c0714 60%, #050308 100%)',
    particleColor: 'rgba(167, 139, 250, 0.65)',
  },
  'deep-forest': {
    primary: '#10b981',
    primaryHover: '#059669',
    primaryMuted: 'rgba(16, 185, 129, 0.18)',
    accent: '#34d399',
    surface: '#04160f',
    surfaceBorder: 'rgba(16, 185, 129, 0.28)',
    bgGradient: 'radial-gradient(ellipse at bottom, #062b1e 0%, #03140e 60%, #010805 100%)',
    particleColor: 'rgba(52, 211, 153, 0.75)',
  },
  'rainy-window': {
    primary: '#0ea5e9',
    primaryHover: '#0284c7',
    primaryMuted: 'rgba(14, 165, 233, 0.18)',
    accent: '#38bdf8',
    surface: '#08131e',
    surfaceBorder: 'rgba(14, 165, 233, 0.28)',
    bgGradient: 'radial-gradient(ellipse at top, #0f2b48 0%, #081626 60%, #02060b 100%)',
    particleColor: 'rgba(56, 189, 248, 0.75)',
  },
  'starry-cosmos': {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryMuted: 'rgba(99, 102, 241, 0.18)',
    accent: '#818cf8',
    surface: '#090d1c',
    surfaceBorder: 'rgba(99, 102, 241, 0.28)',
    bgGradient: 'radial-gradient(ellipse at center, #111a3b 0%, #080d22 60%, #02030a 100%)',
    particleColor: 'rgba(255, 255, 255, 0.85)',
  },
  'minimal-warmth': {
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryMuted: 'rgba(245, 158, 11, 0.18)',
    accent: '#fbbf24',
    surface: '#17130e',
    surfaceBorder: 'rgba(245, 158, 11, 0.28)',
    bgGradient: 'linear-gradient(135deg, #261c14 0%, #120e0a 60%, #080604 100%)',
    particleColor: 'rgba(251, 191, 36, 0.7)',
  },
  'cyber-focus': {
    primary: '#ec4899',
    primaryHover: '#db2777',
    primaryMuted: 'rgba(236, 72, 153, 0.18)',
    accent: '#f472b6',
    surface: '#18091a',
    surfaceBorder: 'rgba(236, 72, 153, 0.28)',
    bgGradient: 'radial-gradient(circle at 50% 20%, #3b073b 0%, #150317 50%, #050006 100%)',
    particleColor: 'rgba(244, 114, 182, 0.75)',
  },
};

export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: 'twilight-glow',
    name: 'Twilight Glow',
    category: 'ambient-canvas',
    overlayOpacity: 0.35,
    blurAmount: 0,
    sceneType: 'aurora',
    palette: THEME_PALETTES['twilight-glow'],
  },
  {
    id: 'deep-forest',
    name: 'Emerald Forest',
    category: 'ambient-canvas',
    overlayOpacity: 0.4,
    blurAmount: 0,
    sceneType: 'particles',
    palette: THEME_PALETTES['deep-forest'],
  },
  {
    id: 'rainy-window',
    name: 'Rainy Window',
    category: 'ambient-canvas',
    overlayOpacity: 0.3,
    blurAmount: 0,
    sceneType: 'rain',
    palette: THEME_PALETTES['rainy-window'],
  },
  {
    id: 'starry-cosmos',
    name: 'Starry Cosmos',
    category: 'ambient-canvas',
    overlayOpacity: 0.25,
    blurAmount: 0,
    sceneType: 'stars',
    palette: THEME_PALETTES['starry-cosmos'],
  },
  {
    id: 'minimal-warmth',
    name: 'Minimal Warmth',
    category: 'minimal',
    overlayOpacity: 0.1,
    blurAmount: 0,
    sceneType: 'particles',
    palette: THEME_PALETTES['minimal-warmth'],
  },
  {
    id: 'cyber-focus',
    name: 'Obsidian Violet',
    category: 'gradient',
    overlayOpacity: 0.2,
    blurAmount: 0,
    sceneType: 'aurora',
    palette: THEME_PALETTES['cyber-focus'],
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
      this.applyToDocument(this.currentTheme);
    }
  }

  public getTheme(): ThemeConfig {
    return { ...this.currentTheme };
  }

  public getPalette(themeId?: string): ThemePalette {
    const id = themeId || this.currentTheme.id;
    return THEME_PALETTES[id] || THEME_PALETTES['twilight-glow'];
  }

  public setTheme(themeId: string): ThemeConfig {
    const found = PRESET_THEMES.find((t) => t.id === themeId);
    if (found) {
      this.currentTheme = { ...found };
      this.applyToDocument(this.currentTheme);
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
    const palette = this.getPalette(this.currentTheme.id);
    return { background: palette.bgGradient };
  }

  public applyToDocument(theme: ThemeConfig): void {
    if (typeof document === 'undefined') return;
    const palette = theme.palette || this.getPalette(theme.id);
    const root = document.documentElement;

    root.style.setProperty('--color-primary-400', palette.accent);
    root.style.setProperty('--color-primary-500', palette.primary);
    root.style.setProperty('--color-primary-600', palette.primaryHover);
    root.style.setProperty('--color-primary-700', palette.primaryHover);
    root.style.setProperty('--theme-surface', palette.surface);
    root.style.setProperty('--theme-border', palette.surfaceBorder);
    root.style.setProperty('--theme-accent', palette.accent);
    root.style.setProperty('--theme-particle', palette.particleColor);
    root.setAttribute('data-theme', theme.id);
  }

  public isMotionReduced(): boolean {
    return this.isReducedMotion;
  }
}
