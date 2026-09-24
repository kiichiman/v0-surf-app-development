'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { ALL_BOUNDS, getSupabase } from '@/lib/disaster/core';

const LAST_SEEN_KEY = 'disaster_last_seen';
const DAY_MS = 24 * 60 * 60 * 1000;

function readLastSeen(): number {
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    if (raw === null) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeLastSeen(value: number): void {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(value));
  } catch {
    // 保存に失敗しても動作は継続する
  }
}

export function useDisasterUpdates(): {
  hasNew: boolean;
  newCount: number;
  markSeen: () => void;
} {
  const [newCount, setNewCount] = useState(0);
  const newCountRef = useRef(0);

  useEffect(() => {
    newCountRef.current = newCount;
  }, [newCount]);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setNewCount(0);
      return;
    }

    const { data, error } = await supabase
      .from('reports')
      .select('id,lat,lng,created_at,restored_at');

    if (error || !data) {
      return;
    }

    const south = ALL_BOUNDS[0][0];
    const west = ALL_BOUNDS[0][1];
    const north = ALL_BOUNDS[1][0];
    const east = ALL_BOUNDS[1][1];

    const lastSeen = readLastSeen();
    const threshold = Math.max(lastSeen, Date.now() - DAY_MS);

    let count = 0;
    for (const row of data as {
      id: unknown;
      lat: number | null;
      lng: number | null;
      created_at: string | null;
      restored_at: string | null;
    }[]) {
      if (row.lat === null || row.lng === null) continue;
      if (row.lat < south || row.lat > north) continue;
      if (row.lng < west || row.lng > east) continue;

      const createdMs = row.created_at ? Date.parse(row.created_at) : NaN;
      const restoredMs = row.restored_at ? Date.parse(row.restored_at) : NaN;
      const createdValid = Number.isFinite(createdMs);
      const restoredValid = Number.isFinite(restoredMs);
      let updatedMs: number;
      if (createdValid && restoredValid) {
        updatedMs = Math.max(createdMs, restoredMs);
      } else if (createdValid) {
        updatedMs = createdMs;
      } else if (restoredValid) {
        updatedMs = restoredMs;
      } else {
        continue;
      }

      if (updatedMs > threshold) {
        count += 1;
      }
    }

    setNewCount(count);
  }, []);

  const markSeen = useCallback(() => {
    writeLastSeen(Date.now());
    setNewCount(0);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();

    void refresh();

    let intervalId: ReturnType<typeof setInterval> | undefined;
    intervalId = setInterval(() => {
      void refresh();
    }, 5 * 60 * 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let channel: RealtimeChannel | undefined;
    if (supabase) {
      channel = supabase
        .channel('reports-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reports' },
          () => {
            void refresh();
          },
        )
        .subscribe();
    }

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [refresh]);

  return { hasNew: newCount > 0, newCount, markSeen };
}
