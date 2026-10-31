import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, Chip, Field } from '../components/ui';
import { NOTE_META } from '../kinds';
import { useStore } from '../store';
import type { Note, NoteKind } from '../types';
import { dayKey, fmtDate, fmtTime } from '../util';

export function JournalScreen({ onOpenEpisode }: { onOpenEpisode: () => void }) {
  const { data, addNote, deleteNote } = useStore();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<NoteKind>('thought');

  const notes = useMemo(
    () => [...data.notes].sort((a, b) => b.at - a.at),
    [data.notes]
  );

  const groups = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const n of notes) {
      const k = dayKey(n.at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(n);
    }
    return map;
  }, [notes]);

  const saveThought = () => {
    if (!text.trim()) return;
    addNote({ kind, text: text.trim() });
    setText('');
    setKind('thought');
  };

  return (
    <div className="screen">
      <h1 className="h1">Notebook</h1>
      <p className="small dim" style={{ marginTop: 4 }}>
        Every entry is stamped with the time. For a full episode record, use the button below.
      </p>

      <button
        className="card card-tap row"
        style={{ marginTop: 14, width: '100%', textAlign: 'left', borderColor: 'rgba(240,147,143,0.35)', background: 'rgba(240,147,143,0.07)' }}
        onClick={onOpenEpisode}
      >
        <div className="grow">
          <p style={{ fontWeight: 700, fontSize: 16 }}>Record an episode</p>
          <p className="tiny dim" style={{ marginTop: 2 }}>With anxiety level, triggers and weather</p>
        </div>
        <Icon name="chevron" size={20} color="#F0938F" />
      </button>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ marginBottom: 10, gap: 8 }}>
          {(['thought', 'win'] as NoteKind[]).map((k) => (
            <Chip key={k} label={k === 'thought' ? 'Thought' : 'Win'} on={kind === k} onPress={() => setKind(k)} />
          ))}
        </div>
        <Field
          value={text}
          onChange={setText}
          multiline
          minHeight={90}
          placeholder="Write what's on your mind…"
        />
        <div className="row" style={{ marginTop: 8, justifyContent: 'flex-end', gap: 8 }}>
          <span className="tiny faint grow">
            stamped at save time
          </span>
          <Button
            label="Add"
            variant="soft"
            onPress={saveThought}
            disabled={!text.trim()}
            icon={<Icon name="plus" size={16} color={text.trim() ? 'var(--text)' : '#6F7F9A'} />}
          />
        </div>
      </div>

      <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Entries</div>
      {notes.length === 0 ? (
        <div className="card"><p className="small dim">Nothing yet. The first entry is the hardest one.</p></div>
      ) : (
        [...groups.entries()].map(([k, items]) => (
          <div key={k} style={{ marginBottom: 18 }}>
            <p className="label" style={{ marginBottom: 6 }}>{fmtDate(items[0].at)}</p>
            <div className="card" style={{ padding: '4px 16px' }}>
              {items.map((n) => (
                <div key={n.id} className="entry-row" style={{ alignItems: 'flex-start' }}>
                  <span className="entry-dot" style={{ background: NOTE_META[n.kind].color, marginTop: 6 }} />
                  <div className="grow">
                    <div className="row" style={{ gap: 8 }}>
                      <span className="small" style={{ fontWeight: 600 }}>
                        {n.kind === 'episode' ? 'Episode' : n.kind === 'win' ? 'Win' : 'Thought'}
                      </span>
                      <span className="tiny faint">{fmtTime(n.at)}</span>
                    </div>
                    <p className="small dim" style={{ marginTop: 3, whiteSpace: 'pre-wrap' }}>{n.text}</p>
                    {n.kind === 'episode' ? (
                      <div className="row wrap" style={{ marginTop: 6, gap: 6 }}>
                        {n.anxiety !== undefined ? <Tag label={`anxiety ${n.anxiety}/10`} /> : null}
                        {n.triggers?.length ? n.triggers!.map((t) => <Tag key={t} label={t} />) : null}
                        {n.weather ? <Tag label={`${n.weather.pressureHpa} hPa · ${n.weather.trendLabel}`} /> : null}
                      </div>
                    ) : null}
                  </div>
                  <button
                    onClick={() => deleteNote(n.id)}
                    aria-label="Delete"
                    style={{ width: 30, height: 30, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
                  >
                    <Icon name="trash" size={15} color="#6F7F9A" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      className="tiny"
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid var(--border)',
        color: 'var(--text-faint)',
      }}
    >
      {label}
    </span>
  );
}
