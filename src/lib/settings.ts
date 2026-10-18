import { useCallback, useEffect, useState } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemeChoice;
  sound: boolean;
}

const STORAGE_KEY = 'spourt-english:settings:v1';
export const DEFAULT_SETTINGS: Settings = { theme: 'system', sound: true };

/** Parses saved settings, ignoring anything unknown or malformed. */
export function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const data = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: data.theme === 'light' || data.theme === 'dark' ? data.theme : 'system',
      sound: typeof data.sound === 'boolean' ? data.sound : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function load(): Settings {
  try {
    return parseSettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Per-device preferences. The theme is applied as `data-theme` on <html> ("system" removes it). */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore – preferences just won't persist.
    }
    const root = document.documentElement;
    if (settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
  }, [settings]);

  const change = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  return { settings, change };
}
