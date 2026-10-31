import type { NoteKind, TrackKind } from './types';
import type { IconName } from './components/Icon';

export const KIND_META: Record<TrackKind, { label: string; icon: IconName; color: string }> = {
  exercise: { label: 'Exercise', icon: 'run', color: '#7FA9FF' },
  meditation: { label: 'Meditation', icon: 'meditate', color: '#5FE3C8' },
  sleep: { label: 'Sleep', icon: 'moon', color: '#A78BFA' },
  coffee: { label: 'Coffee', icon: 'coffee', color: '#F0BC78' },
  mood: { label: 'Mood', icon: 'mood', color: '#5FE3C8' },
};

export const NOTE_META: Record<NoteKind, { label: string; color: string }> = {
  thought: { label: 'Thought', color: '#A7B6CE' },
  episode: { label: 'Episode', color: '#F0938F' },
  win: { label: 'Win', color: '#5FE3C8' },
};

/** Safe lookup: entries saved before a tracker was removed still render. */
export function kindMeta(kind: string): { label: string; icon: IconName; color: string } {
  return (
    (KIND_META as Record<string, { label: string; icon: IconName; color: string }>)[kind] ?? {
      label: 'Entry',
      icon: 'today',
      color: '#6F7F9A',
    }
  );
}

export function entryTitle(e: import('./types').Entry): string {
  switch (e.kind) {
    case 'exercise': return `${e.exerciseType ?? 'Exercise'} · ${e.minutes ?? 0} min`;
    case 'meditation': return `${e.meditationType ?? 'Meditation'} · ${e.minutes ?? 0} min`;
    case 'sleep': return `Sleep · ${e.hours ?? '?'}h`;
    case 'coffee': return `Coffee · ${e.cups ?? 0} cups (${e.mg ?? 0} mg)`;
    case 'mood': return `Mood ${e.mood ?? '-'}/10`;
    default:
      // a tracker that has since been retired; keep the record visible
      return 'Entry';
  }
}
