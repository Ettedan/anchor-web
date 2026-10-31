import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { emptyData } from './types';
import type { AppData, Entry, Note, Settings } from './types';
import { newId } from './util';
import {
  ConflictError,
  loadSyncConfig,
  mergeData,
  pullRemote,
  pushRemote,
  saveSyncConfig,
  testConnection,
} from './sync';
import type { SyncConfig } from './sync';

const KEY = 'anchor-web:v1';

export type SyncState = 'off' | 'connecting' | 'idle' | 'syncing' | 'error';

type Store = {
  data: AppData;
  ready: boolean;
  addEntry: (input: Omit<Entry, 'id' | 'at'> & { at?: number }) => Entry;
  addNote: (input: Omit<Note, 'id' | 'at'> & { at?: number }) => Note;
  updateSettings: (patch: Partial<Settings>) => void;
  deleteEntry: (id: string) => void;
  deleteNote: (id: string) => void;
  clearAll: () => void;
  exportJson: () => string;
  importJson: (raw: string) => boolean;
  syncConfig: SyncConfig | null;
  syncState: SyncState;
  syncError: string | null;
  connectSync: (owner: string, repo: string, token: string) => Promise<void>;
  disconnectSync: () => void;
  syncNow: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function AnchorProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('off');
  const [syncError, setSyncError] = useState<string | null>(null);

  const sha = useRef<string | null>(null);
  const dirty = useRef(false);
  const bootstrapped = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------------------------------------------- local load */

  useEffect(() => {
    let alive = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw && alive) {
        const parsed = JSON.parse(raw) as Partial<AppData>;
        setData({
          version: 2,
          entries: parsed.entries ?? [],
          notes: parsed.notes ?? [],
          settings: { ...emptyData().settings, ...(parsed.settings ?? {}) },
          deleted: parsed.deleted ?? {},
          updatedAt: parsed.updatedAt ?? 0,
        });
      }
    } catch (err) {
      console.warn('[anchor] could not read local data', err);
    } finally {
      if (alive) setReady(true);
    }
    return () => {
      alive = false;
    };
  }, []);

  /* --------------------------------------------------- local save */

  useEffect(() => {
    if (!ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('[anchor] could not save local data', err);
      }
    }, 150);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, ready]);

  /* ------------------------------------------------- local mutate */

  const mutate = useCallback((fn: (d: AppData) => AppData) => {
    dirty.current = true;
    setData((d) => ({ ...fn(d), updatedAt: Date.now() }));
  }, []);

  const addEntry = useCallback(
    (input: Omit<Entry, 'id' | 'at'> & { at?: number }) => {
      const record: Entry = { ...input, id: newId(), at: input.at ?? Date.now() };
      mutate((d) => ({ ...d, entries: [record, ...d.entries] }));
      return record;
    },
    [mutate]
  );

  const addNote = useCallback(
    (input: Omit<Note, 'id' | 'at'> & { at?: number }) => {
      const record: Note = { ...input, id: newId(), at: input.at ?? Date.now() };
      mutate((d) => ({ ...d, notes: [record, ...d.notes] }));
      return record;
    },
    [mutate]
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    },
    [mutate]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      mutate((d) => ({
        ...d,
        entries: d.entries.filter((e) => e.id !== id),
        deleted: { ...d.deleted, [id]: Date.now() },
      }));
    },
    [mutate]
  );

  const deleteNote = useCallback(
    (id: string) => {
      mutate((d) => ({
        ...d,
        notes: d.notes.filter((n) => n.id !== id),
        deleted: { ...d.deleted, [id]: Date.now() },
      }));
    },
    [mutate]
  );

  const clearAll = useCallback(() => {
    dirty.current = true;
    setData((d) => {
      const deleted: Record<string, number> = { ...d.deleted };
      const now = Date.now();
      for (const e of d.entries) deleted[e.id] = now;
      for (const n of d.notes) deleted[n.id] = now;
      return { ...emptyData(), settings: d.settings, deleted, updatedAt: now };
    });
  }, []);

  const exportJson = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const importJson = useCallback((raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      dirty.current = true;
      setData({
        version: 2,
        entries: parsed.entries ?? [],
        notes: parsed.notes ?? [],
        settings: { ...emptyData().settings, ...(parsed.settings ?? {}) },
        deleted: parsed.deleted ?? {},
        updatedAt: Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  /* --------------------------------------------------------- sync */

  const applyRemote = useCallback((next: AppData) => {
    dirty.current = false;
    setData(next);
  }, []);

  const push = useCallback(
    async (config: SyncConfig, doc: AppData) => {
      setSyncState('syncing');
      try {
        // Read before writing so another device's records are never clobbered.
        const remote = await pullRemote(config);
        const merged = remote.data ? mergeData(doc, remote.data) : doc;
        sha.current = await pushRemote(config, merged, remote.sha);

        if (remote.data !== null && JSON.stringify(merged) !== JSON.stringify(doc)) {
          applyRemote(merged);
        } else {
          dirty.current = false;
        }

        setSyncState('idle');
        setSyncError(null);
        const nextConfig = { ...config, lastSync: Date.now() };
        setSyncConfig(nextConfig);
        saveSyncConfig(nextConfig);
      } catch (err) {
        if (err instanceof ConflictError) {
          try {
            const remote = await pullRemote(config);
            const merged = remote.data ? mergeData(doc, remote.data) : doc;
            sha.current = await pushRemote(config, merged, remote.sha);
            applyRemote(merged);
            setSyncState('idle');
            setSyncError(null);
            const nextConfig = { ...config, lastSync: Date.now() };
            setSyncConfig(nextConfig);
            saveSyncConfig(nextConfig);
            return;
          } catch (retryErr) {
            setSyncState('error');
            setSyncError(errMessage(retryErr));
            return;
          }
        }
        setSyncState('error');
        setSyncError(errMessage(err));
      }
    },
    [applyRemote]
  );

  // Pull once, after local data is ready. Guarded so it never re-runs on data changes.
  useEffect(() => {
    if (!ready || bootstrapped.current) return;
    bootstrapped.current = true;

    const config = loadSyncConfig();
    if (!config) return;
    setSyncConfig(config);
    setSyncState('syncing');

    let alive = true;
    (async () => {
      try {
        const remote = await pullRemote(config);
        sha.current = remote.sha;
        if (!alive) return;

        const local = dataRef.current;
        if (remote.data) {
          const merged = mergeData(local, remote.data);
          if (JSON.stringify(merged) !== JSON.stringify(local)) applyRemote(merged);
          if (
            local.entries.length > (remote.data.entries?.length ?? 0) ||
            local.notes.length > (remote.data.notes?.length ?? 0)
          ) {
            dirty.current = true;
          }
        } else if (local.entries.length > 0 || local.notes.length > 0) {
          dirty.current = true; // seed the empty remote with local data
        }
        setSyncState('idle');
        setSyncError(null);
      } catch (err) {
        if (!alive) return;
        setSyncState('error');
        setSyncError(errMessage(err));
      }
    })();

    return () => {
      alive = false;
    };
  }, [ready, applyRemote]);

  // Debounced push after a local change.
  useEffect(() => {
    if (!ready || !syncConfig || !dirty.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      if (dirty.current) void push(syncConfig, data);
    }, 1200);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [data, ready, syncConfig, push]);

  const connectSync = useCallback(
    async (owner: string, repo: string, token: string) => {
      const config: SyncConfig = { owner, repo, token, lastSync: null };
      setSyncState('connecting');
      setSyncError(null);
      try {
        await testConnection(config);
        saveSyncConfig(config);
        setSyncConfig(config);
        sha.current = null;
        dirty.current = true;
        await push(config, data);
      } catch (err) {
        setSyncState('error');
        setSyncError(errMessage(err));
        throw err;
      }
    },
    [data, push]
  );

  const disconnectSync = useCallback(() => {
    saveSyncConfig(null);
    setSyncConfig(null);
    setSyncState('off');
    setSyncError(null);
    sha.current = null;
  }, []);

  const syncNow = useCallback(async () => {
    if (!syncConfig) return;
    dirty.current = true;
    await push(syncConfig, data);
  }, [syncConfig, data, push]);

  const value = useMemo<Store>(
    () => ({
      data,
      ready,
      addEntry,
      addNote,
      updateSettings,
      deleteEntry,
      deleteNote,
      clearAll,
      exportJson,
      importJson,
      syncConfig,
      syncState,
      syncError,
      connectSync,
      disconnectSync,
      syncNow,
    }),
    [
      data,
      ready,
      addEntry,
      addNote,
      updateSettings,
      deleteEntry,
      deleteNote,
      clearAll,
      exportJson,
      importJson,
      syncConfig,
      syncState,
      syncError,
      connectSync,
      disconnectSync,
      syncNow,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Sync failed.';
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AnchorProvider>');
  return ctx;
}
