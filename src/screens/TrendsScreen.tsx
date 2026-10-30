import { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Stat } from '../components/ui';
import { useStore } from '../store';
import { dayKey, dayStart, fmtDate, fmtTime } from '../util';

function moodColor(n: number): string {
  if (n >= 7) return 'var(--accent)';
  if (n >= 4) return 'var(--amber)';
  return 'var(--coral)';
}

export function TrendsScreen() {
  const { data } = useStore();

  const days = useMemo(() => {
    const out: { key: string; label: string; avg: number | null }[] = [];
    for (let i = 13; i >= 0; i--) {
      const start = dayStart(-i);
      const end = start + 86400000;
      const moods = data.entries.filter(
        (e) => e.kind === 'mood' && e.mood !== undefined && e.at >= start && e.at < end
      ).map((e) => e.mood as number);
      const d = new Date(start);
      out.push({
        key: dayKey(start),
        label: 'SMTWTFS'[d.getDay()],
        avg: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
      });
    }
    return out;
  }, [data.entries]);

  const week = useMemo(() => {
    const from = dayStart(-6);
    const entries = data.entries.filter((e) => e.at >= from);
    const exercise = entries.filter((e) => e.kind === 'exercise').length;
    const medMin = entries.filter((e) => e.kind === 'meditation').reduce((s, e) => s + (e.minutes ?? 0), 0);
    const sleeps = entries.filter((e) => e.kind === 'sleep' && e.hours !== undefined).map((e) => e.hours as number);
    const sleepAvg = sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : null;
    const coffees = entries.filter((e) => e.kind === 'coffee').map((e) => e.mg ?? 0);
    const coffeeAvg = coffees.length ? coffees.reduce((a, b) => a + b, 0) / coffees.length : null;
    return { exercise, medMin, sleepAvg, coffeeAvg };
  }, [data.entries]);

  const episodes = useMemo(
    () => data.notes.filter((n) => n.kind === 'episode').sort((a, b) => b.at - a.at).slice(0, 8),
    [data.notes]
  );

  const anyMood = days.some((d) => d.avg !== null);

  return (
    <div className="screen">
      <h1 className="h1">Trends</h1>
      <p className="small dim" style={{ marginTop: 4 }}>Patterns, not grades. Nothing here is a verdict.</p>

      <div className="grid2" style={{ marginTop: 16 }}>
        <Stat label="Exercise · 7d" value={`${week.exercise}`} foot="sessions" tint="var(--blue)" />
        <Stat label="Meditation · 7d" value={`${week.medMin}m`} foot="total" tint="var(--accent)" />
        <Stat label="Avg sleep · 7d" value={week.sleepAvg === null ? '—' : `${week.sleepAvg.toFixed(1)}h`} foot="in bed" tint="var(--text)" />
        <Stat label="Avg coffee · 7d" value={week.coffeeAvg === null ? '—' : `${Math.round(week.coffeeAvg)}mg`} foot="per day" tint="var(--amber)" />
      </div>

      <div className="label" style={{ marginTop: 22, marginBottom: 10 }}>Mood · last 14 days</div>
      <div className="card">
        {anyMood ? (
          <svg viewBox="0 0 280 110" width="100%" height="110" preserveAspectRatio="none" role="img" aria-label="Mood over the last 14 days">
            {days.map((d, i) => {
              const x = (i / days.length) * 280 + 2;
              const w = 280 / days.length - 4;
              const filled = d.avg !== null;
              const h = filled ? Math.max(5, (d.avg! / 10) * 96) : 3;
              const y = 106 - h;
              return (
                <g key={d.key}>
                  <rect x={x} y={y} width={w} height={h} rx={2.5}
                    fill={filled ? moodColor(d.avg!) : 'var(--border-soft)'}
                    opacity={filled ? 0.92 : 0.8} />
                  <text x={x + w / 2} y={106} textAnchor="middle" fontSize="7"
                    fill="var(--text-faint)" style={{ letterSpacing: 0 }}>
                    {i % 2 === 0 ? d.label : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <p className="small dim">Log a mood to start the chart. One number a day is enough.</p>
        )}
      </div>

      <div className="label" style={{ marginTop: 22, marginBottom: 10 }}>Recent episodes</div>
      {episodes.length === 0 ? (
        <div className="card"><p className="small dim">No episodes recorded yet. When one happens, write it down — the record is the medicine.</p></div>
      ) : (
        <div className="card" style={{ padding: '4px 16px' }}>
          {episodes.map((n) => (
            <div key={n.id} className="entry-row" style={{ alignItems: 'flex-start' }}>
              <span className="entry-dot" style={{ background: 'var(--coral)', marginTop: 6 }} />
              <div className="grow">
                <div className="row" style={{ gap: 8 }}>
                  <span className="tiny faint">{fmtDate(n.at)} · {fmtTime(n.at)}</span>
                  {n.anxiety !== undefined ? <span className="tiny" style={{ color: 'var(--coral)' }}>anxiety {n.anxiety}/10</span> : null}
                </div>
                <p className="small dim" style={{ marginTop: 3 }}>
                  {n.text.length > 110 ? `${n.text.slice(0, 110)}…` : n.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: 18, gap: 8, color: 'var(--text-faint)' }}>
        <Icon name="gauge" size={16} color="#6F7F9A" />
        <p className="tiny">Two or three points is noise. A month of data starts to mean something.</p>
      </div>
    </div>
  );
}
