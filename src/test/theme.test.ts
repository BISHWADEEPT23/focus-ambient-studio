import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeEngine, PRESET_THEMES, THEME_PALETTES } from '../core/themes/themeEngine';

describe('Theme Engine & Dynamic Styling Unit Tests', () => {
  beforeEach(() => {
    // Clean up document styles
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
  });

  it('contains all preset themes with complete color palettes', () => {
    expect(PRESET_THEMES.length).toBeGreaterThanOrEqual(6);
    const themeIds = PRESET_THEMES.map((t) => t.id);

    expect(themeIds).toContain('twilight-glow');
    expect(themeIds).toContain('deep-forest');
    expect(themeIds).toContain('rainy-window');
    expect(themeIds).toContain('starry-cosmos');
    expect(themeIds).toContain('minimal-warmth');
    expect(themeIds).toContain('cyber-focus');

    for (const theme of PRESET_THEMES) {
      const palette = THEME_PALETTES[theme.id];
      expect(palette).toBeDefined();
      expect(palette.primary).toBeDefined();
      expect(palette.primaryHover).toBeDefined();
      expect(palette.accent).toBeDefined();
      expect(palette.surface).toBeDefined();
      expect(palette.surfaceBorder).toBeDefined();
      expect(palette.bgGradient).toBeDefined();
      expect(palette.particleColor).toBeDefined();
    }
  });

  it('applies CSS custom properties and data-theme to documentElement on initialization', () => {
    new ThemeEngine(PRESET_THEMES[0]);
    const root = document.documentElement;

    expect(root.getAttribute('data-theme')).toBe('twilight-glow');
    expect(root.style.getPropertyValue('--color-primary-500')).toBe('#8b5cf6');
    expect(root.style.getPropertyValue('--color-primary-400')).toBe('#a78bfa');
    expect(root.style.getPropertyValue('--color-primary-600')).toBe('#7c3aed');
    expect(root.style.getPropertyValue('--theme-surface')).toBe('#0d0b18');
    expect(root.style.getPropertyValue('--theme-border')).toBe('rgba(139, 92, 246, 0.25)');
    expect(root.style.getPropertyValue('--theme-particle')).toBe('rgba(167, 139, 250, 0.65)');
  });

  it('switches themes dynamically and updates documentElement CSS variables', () => {
    const engine = new ThemeEngine(PRESET_THEMES[0]);
    const root = document.documentElement;

    // Switch to Deep Forest (Emerald)
    engine.setTheme('deep-forest');
    expect(root.getAttribute('data-theme')).toBe('deep-forest');
    expect(root.style.getPropertyValue('--color-primary-500')).toBe('#10b981');
    expect(root.style.getPropertyValue('--color-primary-400')).toBe('#34d399');
    expect(root.style.getPropertyValue('--theme-surface')).toBe('#04160f');

    // Switch to Rainy Window (Sky Blue)
    engine.setTheme('rainy-window');
    expect(root.getAttribute('data-theme')).toBe('rainy-window');
    expect(root.style.getPropertyValue('--color-primary-500')).toBe('#0ea5e9');
    expect(root.style.getPropertyValue('--color-primary-400')).toBe('#38bdf8');
    expect(root.style.getPropertyValue('--theme-surface')).toBe('#08131e');

    // Switch to Cyber Focus (Pink)
    engine.setTheme('cyber-focus');
    expect(root.getAttribute('data-theme')).toBe('cyber-focus');
    expect(root.style.getPropertyValue('--color-primary-500')).toBe('#ec4899');
    expect(root.style.getPropertyValue('--color-primary-400')).toBe('#f472b6');
    expect(root.style.getPropertyValue('--theme-surface')).toBe('#18091a');
  });

  it('generates distinct background gradients for different themes', () => {
    const engine = new ThemeEngine(PRESET_THEMES[0]);
    const bgTwilight = engine.getBackgroundStyle().background;

    engine.setTheme('deep-forest');
    const bgForest = engine.getBackgroundStyle().background;

    engine.setTheme('starry-cosmos');
    const bgCosmos = engine.getBackgroundStyle().background;

    expect(bgTwilight).not.toEqual(bgForest);
    expect(bgForest).not.toEqual(bgCosmos);
  });
});
