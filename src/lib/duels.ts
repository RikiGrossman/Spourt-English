/**
 * The learner's side of head-to-head duels (shared/duels.ts): the list from the backend, and the
 * prize of each finished duel, collected once on this device (like group challenges).
 */
import { useCallback, useEffect, useState } from 'react';
import { DUEL_PRIZES, type DuelResult, type DuelSummary } from '../../shared/duels';
import { api, errorMessage } from './api';

export const DUELS_KEY = 'spourt-english:duels:v1';

/** Each learner signed in on the device keeps their own list of collected prizes. */
const storageKey = (userId: string) => `${DUELS_KEY}:${userId}`;

export function loadClaimed(userId: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveClaimed(userId: string, claimed: string[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(claimed));
  } catch {
    // Storage unavailable – the prize just shows again.
  }
}

/** Finished duels whose prize wasn't collected yet. */
export function unclaimedDuels(duels: DuelSummary[] | null, claimed: string[]): DuelSummary[] {
  return (duels ?? []).filter((d) => d.state === 'finished' && !claimed.includes(d.id));
}

/** "Ends in …" for a duel: hours in the last day, days before. */
export function timeLeftText(endsAt: number, now = Date.now()): string {
  const hours = Math.max(0, Math.ceil((endsAt - now) / 3_600_000));
  if (hours <= 24) return hours <= 1 ? 'פחות משעה' : `${hours} שעות`;
  const days = Math.ceil(hours / 24);
  return days === 2 ? 'יומיים' : `${days} ימים`;
}

export interface DuelsState {
  /** null until the first answer (or while signed out). */
  duels: DuelSummary[] | null;
  error: string | null;
  claimed: string[];
  /** Finished duels with a prize waiting. */
  unclaimed: number;
  refresh: () => Promise<void>;
  /** Collects a finished duel's prize once; null when there is nothing to collect. */
  claim: (duelId: string) => { result: DuelResult; gems: number } | null;
}

/** The signed-in learner's duels, loaded on sign-in and whenever `refresh` is called. */
export function useDuels(userId: string | null): DuelsState {
  const [duels, setDuels] = useState<DuelSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setDuels((await api.duels()).duels);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [userId]);

  useEffect(() => {
    setDuels(null);
    setError(null);
    setClaimed(userId ? loadClaimed(userId) : []);
    void refresh();
  }, [userId, refresh]);

  const claim = useCallback(
    (duelId: string) => {
      const duel = duels?.find((d) => d.id === duelId);
      if (!userId || !duel?.result || claimed.includes(duelId)) return null;
      const next = [...claimed, duelId];
      saveClaimed(userId, next);
      setClaimed(next);
      return { result: duel.result, gems: DUEL_PRIZES[duel.result] };
    },
    [userId, duels, claimed],
  );

  return { duels, error, claimed, unclaimed: unclaimedDuels(duels, claimed).length, refresh, claim };
}

/** Reads `?duel=CODE` from the address (a shared duel link) and removes it from the address bar. */
export function takeDuelCode(): string | null {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('duel');
    if (!code) return null;
    url.searchParams.delete('duel');
    window.history.replaceState(window.history.state, '', url.href);
    return code;
  } catch {
    return null;
  }
}
