import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { useCallback, useEffect, useState } from 'react';

// In-app updates for the Android app: CI publishes version.json next to the APK in the
// "android-latest" release (.github/workflows/android.yml); the native AppUpdate plugin
// (android/.../AppUpdatePlugin.java) downloads the APK and opens Android's installer.
const RELEASE_URL = 'https://github.com/RikiGrossman/Spourt-English/releases/download/android-latest';
export const VERSION_URL = `${RELEASE_URL}/version.json`;
export const APK_URL = `${RELEASE_URL}/SpourtEnglish.apk`;

interface AppUpdatePlugin {
  getInstalledVersion(): Promise<{ versionCode: number; versionName: string }>;
  fetchText(options: { url: string }): Promise<{ text: string }>;
  downloadAndInstall(options: { url: string }): Promise<void>;
  addListener(event: 'progress', listener: (e: { percent: number }) => void): Promise<PluginListenerHandle>;
}

const AppUpdate = registerPlugin<AppUpdatePlugin>('AppUpdate');

export interface LatestVersion {
  versionCode: number;
  versionName: string;
}

/** Reads the published version.json; null when it is missing or malformed. */
export function parseLatestVersion(text: string): LatestVersion | null {
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null) return null;
    const { versionCode, versionName } = data as Record<string, unknown>;
    if (typeof versionCode !== 'number' || !Number.isInteger(versionCode) || versionCode < 1) return null;
    return { versionCode, versionName: typeof versionName === 'string' ? versionName : `1.0.${versionCode}` };
  } catch {
    return null;
  }
}

/** The published version when it is newer than the installed one, otherwise null. */
export function newerVersion(installedCode: number, latest: LatestVersion | null): LatestVersion | null {
  return latest && latest.versionCode > installedCode ? latest : null;
}

export type UpdateState =
  | { status: 'idle' }
  | { status: 'available'; version: LatestVersion }
  | { status: 'downloading'; version: LatestVersion; percent: number }
  | { status: 'failed'; version: LatestVersion };

/** Checks once on launch (Android app only) and drives the download + install. */
export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>({ status: 'idle' });

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    let cancelled = false;
    void (async () => {
      try {
        const [installed, { text }] = await Promise.all([
          AppUpdate.getInstalledVersion(),
          AppUpdate.fetchText({ url: `${VERSION_URL}?t=${Date.now()}` }),
        ]);
        const version = newerVersion(installed.versionCode, parseLatestVersion(text));
        if (version && !cancelled) setState({ status: 'available', version });
      } catch {
        // Offline, or the release is being republished – try again next launch.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const install = useCallback(async () => {
    if (state.status !== 'available' && state.status !== 'failed') return;
    const { version } = state;
    setState({ status: 'downloading', version, percent: 0 });
    const listener = await AppUpdate.addListener('progress', ({ percent }) =>
      setState({ status: 'downloading', version, percent }),
    );
    try {
      await AppUpdate.downloadAndInstall({ url: APK_URL });
      // Android's installer is open now; if the learner backs out, offer the button again.
      setState({ status: 'available', version });
    } catch {
      setState({ status: 'failed', version });
    } finally {
      void listener.remove();
    }
  }, [state]);

  const dismiss = useCallback(() => setState({ status: 'idle' }), []);

  return { state, install, dismiss };
}
