import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { emptyData } from './types';
import type { AppData, Entry, Note, Settings } from './types';
import { newId } from './util';

const KEY = 'anchor-web:v1';

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
};

const StoreContext = createContext<Store | null>(null);

export function AnchorProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw && alive) {
        const parsed = JSON.parse(raw) as Partial<AppData>;
        setData({
          entries: parsed.entries ?? [],
          notes: parsed.notes ?? [],
          settings: { ...emptyData().settings, ...(parsed.settings ?? {}) },
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

  const addEntry = useCallback((input: Omit<Entry, 'id' | 'at'> & { at?: number }) => {
    const record: Entry = { ...input, id: newId(), at: input.at ?? Date.now() };
    setData((d) => ({ ...d, entries: [record, ...d.entries] }));
    return record;
  }, []);

  const addNote = useCallback((input: Omit<Note, 'id' | 'at'> & { at?: number }) => {
    const record: Note = { ...input, id: newId(), at: input.at ?? Date.now() };
    setData((d) => ({ ...d, notes: [record, ...d.notes] }));
    return record;
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setData((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setData((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }));
  }, []);

  const clearAll = useCallback(() => {
    setData((d) => ({ ...emptyData(), settings: d.settings }));
  }, []);

  const exportJson = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const importJson = useCallback((raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      setData({
        entries: parsed.entries ?? [],
        notes: parsed.notes ?? [],
        settings: { ...emptyData().settings, ...(parsed.settings ?? {}) },
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
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
    }),
    [data, ready, addEntry, addNote, updateSettings, deleteEntry, deleteNote, clearAll, exportJson, importJson]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AnchorProvider>');
  return ctx;
}
