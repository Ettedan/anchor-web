export type TrackKind = 'exercise' | 'meditation' | 'sleep' | 'coffee' | 'mood';
export type NoteKind = 'thought' | 'episode' | 'win';

export type WeatherSnap = {
  tempC: number;
  pressureHpa: number;
  humidity: number;
  /** pressure change over the last ~3 hours, hPa */
  delta3h: number;
  trend: 'falling-fast' | 'falling' | 'steady' | 'rising';
  trendLabel: string;
  at: number;
};

export type Entry = {
  id: string;
  at: number;
  kind: TrackKind;
  note?: string;
  weather?: WeatherSnap;
  // exercise
  exerciseType?: string;
  minutes?: number;
  intensity?: 'light' | 'moderate' | 'strong';
  // meditation
  meditationType?: string;
  // sleep (logged once per morning, for the night before)
  bedtime?: string; // "03:00"
  wake?: string; // "11:00"
  hours?: number;
  sleepQuality?: number; // 0-10, 10 = rested
  // coffee
  cups?: number;
  mg?: number;
  coffeeTime?: string;
  // mood — 0-10, 10 = calm
  mood?: number;
};

export type Note = {
  id: string;
  at: number;
  kind: NoteKind;
  text: string;
  anxiety?: number; // 0-10, 10 = worst
  triggers?: string[];
  weather?: WeatherSnap;
};

export type Settings = {
  caffeineTargetMg: number;
  caffeineCutoff: string; // "14:00"
  wakeAnchor: string; // "09:00"
  onboarded: boolean;
};

/** Tombstones for deleted records, so a delete survives a sync merge. */
export type Deleted = Record<string, number>;

export type AppData = {
  version: 2;
  entries: Entry[];
  notes: Note[];
  settings: Settings;
  deleted: Deleted;
  /** bumped on every local change; used to decide which settings win */
  updatedAt: number;
};

export const defaultSettings = (): Settings => ({
  caffeineTargetMg: 200,
  caffeineCutoff: '14:00',
  wakeAnchor: '09:00',
  onboarded: true,
});

export const emptyData = (): AppData => ({
  version: 2,
  entries: [],
  notes: [],
  settings: defaultSettings(),
  deleted: {},
  updatedAt: 0,
});
