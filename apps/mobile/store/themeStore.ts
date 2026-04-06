import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'automatic' | 'light' | 'dark';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'automatic',
      setThemeMode: (mode) => set({ themeMode: mode }),
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'theme-preference',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export function useThemeHydrated(): boolean {
  return useThemeStore((s) => s._hasHydrated);
}

// ─── Resolved isDark hook ─────────────────────────────────────
// Handles 'automatic' by reading the device's system color scheme.

export function useIsDark(): boolean {
  const themeMode = useThemeStore((s) => s.themeMode);
  const colorScheme = useColorScheme(); // 'light' | 'dark' | null
  if (themeMode === 'dark')  return true;
  if (themeMode === 'light') return false;
  return colorScheme === 'dark'; // automatic
}

// ─── Semantic color palettes ──────────────────────────────────

export const LIGHT = {
  bg:        '#F8FAFC',
  surface:   '#FFFFFF',
  surface2:  '#F1F5F9',
  text:      '#1E293B',
  textSub:   '#64748B',
  textMuted: '#94A3B8',
  border:    '#E2E8F0',
  hairline:  '#F1F5F9',
  inputBg:   '#F8FAFC',
};

export const DARK = {
  bg:        '#0F172A',
  surface:   '#1E293B',
  surface2:  '#334155',
  text:      '#F1F5F9',
  textSub:   '#94A3B8',
  textMuted: '#64748B',
  border:    '#334155',
  hairline:  '#1E293B',
  inputBg:   '#1E293B',
};

export type ThemeColors = typeof LIGHT;

export function useThemeColors(): ThemeColors {
  return useIsDark() ? DARK : LIGHT;
}
