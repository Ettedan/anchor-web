export type TrackKind = 'exercise' | 'meditation' | 'sleep' | 'coffee' | 'mood' | 'dizzy';
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
  // dizzy — 0-10, 10 = severe
  dizziness?: number;
  // gut comfort — 0-10, 10 = comfortable
  gut?: number;
};

export type Note = {
  id: string;
  at: number;
  kind: NoteKind;
  text: string;
  anxiety?: number; // 0-10, 10 = worst
  dizziness?: number; // 0-10
  gut?: number; // 0-10 comfort
  triggers?: string[];
  weather?: WeatherSnap;
};

export type Settings = {
  caffeineTargetMg: number;
  caffeineCutoff: string; // "14:00"
  wakeAnchor: string; // "09:00"
  onboarded: boolean;
};

export type AppData = {
  entries: Entry[];
  notes: Note[];
  settings: Settings;
};

export const defaultSettings = (): Settings => ({
  caffeineTargetMg: 200,
  caffeineCutoff: '14:00',
  wakeAnchor: '09:00',
  onboarded: true,
});

export const emptyData = (): AppData => ({
  entries: [],
  notes: [],
  settings: defaultSettings(),
});
