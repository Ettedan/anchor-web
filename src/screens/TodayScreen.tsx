import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { useStore } from '../store';
import type { TrackKind, WeatherSnap } from '../types';
import { entryTitle, KIND_META, NOTE_META } from '../kinds';
import { fmtFull, fmtTime, isToday } from '../util';
import { getWeatherSnapshot, weatherAdvice } from '../weather';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Still awake.';
  if (h < 12) return 'Good morning.';
  if (h < 18) return 'Good afternoon.';
  return 'Good evening.';
};

const TRACKS: { kind: TrackKind; icon: IconName; label: string }[] = [
  { kind: 'mood', icon: 'mood', label: 'Mood' },
  { kind: 'dizzy', icon: 'dizzy', label: 'Body' },
  { kind: 'exercise', icon: 'run', label: 'Exercise' },
  { kind: 'meditation', icon: 'meditate', label: 'Meditate' },
  { kind: 'sleep', icon: 'moon', label: 'Sleep' },
  { kind: 'coffee', icon: 'coffee', label: 'Coffee' },
];

export function TodayScreen({
  onOpenTracker,
  onOpenEpisode,
}: {
  onOpenTracker: (kind: TrackKind) => void;
  onOpenEpisode: () => void;
}) {
  const { data, deleteEntry } = useStore();
  const [weather, setWeather] = useState<WeatherSnap | null>(null);

  useEffect(() => {
    let alive = true;
    getWeatherSnapshot().then((w) => {
      if (alive) setWeather(w);
    });
    return () => {
      alive = false;
    };
  }, []);

  const todayEntries = data.entries.filter((e) => isToday(e.at));
  const todayNotes = data.notes.filter((n) => isToday(n.at));

  return (
    <div className="screen">
      <p className="label" style={{ color: 'var(--accent)' }}>{fmtFull(Date.now())}</p>
      <h1 className="h1" style={{ marginTop: 6 }}>{greeting()}</h1>

      {weather ? (
        <div className="card row" style={{ marginTop: 16, gap: 10 }}>
          <Icon name="weather" size={22} color="#7FA9FF" />
          <div className="grow">
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{weather.tempC}°C</span>
              <span className="dim small">{weather.pressureHpa} hPa</span>
              <span className="small" style={{ color: weather.trend === 'falling' || weather.trend === 'falling-fast' ? 'var(--amber)' : 'var(--accent)' }}>
                {weather.trendLabel}
              </span>
            </div>
            <p className="small dim" style={{ marginTop: 2 }}>{weatherAdvice(weather)}</p>
          </div>
        </div>
      ) : (
        <div className="card row" style={{ marginTop: 16, gap: 10 }}>
          <Icon name="weather" size={22} color="#6F7F9A" />
          <p className="small dim grow">Allow location once to see today's pressure — your main trigger, in numbers.</p>
        </div>
      )}

      <button
        className="card card-tap row"
        style={{ marginTop: 14, width: '100%', textAlign: 'left', borderColor: 'rgba(240,147,143,0.35)', background: 'rgba(240,147,143,0.07)' }}
        onClick={onOpenEpisode}
      >
        <div className="grow">
          <p className="label" style={{ color: 'var(--coral)' }}>Happening now</p>
          <p style={{ fontWeight: 700, fontSize: 17, marginTop: 4 }}>Record an episode</p>
        </div>
        <Icon name="chevron" size={20} color="#F0938F" />
      </button>

      <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Log something</div>
      <div className="grid2">
        {TRACKS.map((t) => (
          <button
            key={t.kind}
            className="card card-tap row"
            style={{ padding: 14, gap: 10 }}
            onClick={() => onOpenTracker(t.kind)}
          >
            <Icon name={t.icon} size={20} color={KIND_META[t.kind].color} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Today so far</div>
      {todayEntries.length === 0 && todayNotes.length === 0 ? (
        <div className="card">
          <p className="small dim">Nothing logged yet today. No pressure — this is here when you are.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '4px 16px' }}>
          {todayNotes.map((n) => (
            <div key={n.id} className="entry-row">
              <span className="entry-dot" style={{ background: NOTE_META[n.kind].color }} />
              <div className="grow">
                <div className="small" style={{ fontWeight: 600 }}>
                  {n.kind === 'episode' ? 'Episode' : n.kind === 'win' ? 'Win' : 'Thought'}
                </div>
                <div className="tiny faint" style={{ marginTop: 1 }}>
                  {n.text.length > 80 ? `${n.text.slice(0, 80)}…` : n.text}
                </div>
              </div>
              <span className="tiny faint">{fmtTime(n.at)}</span>
            </div>
          ))}
          {todayEntries.map((e) => (
            <div key={e.id} className="entry-row">
              <span className="entry-dot" style={{ background: KIND_META[e.kind].color }} />
              <div className="grow">
                <div className="small" style={{ fontWeight: 600 }}>{entryTitle(e)}</div>
                {e.note ? <div className="tiny faint" style={{ marginTop: 1 }}>{e.note}</div> : null}
              </div>
              <button
                onClick={() => deleteEntry(e.id)}
                aria-label="Delete"
                style={{ width: 30, height: 30, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="trash" size={15} color="#6F7F9A" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
