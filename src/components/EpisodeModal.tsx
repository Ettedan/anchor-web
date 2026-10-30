import { useEffect, useRef, useState } from 'react';
import { EPISODE_TRIGGERS } from '../content';
import { useStore } from '../store';
import type { WeatherSnap } from '../types';
import { getWeatherSnapshot } from '../weather';
import { Icon } from './Icon';
import { Button, Chip, Field, LevelScale, Modal, SectionLabel } from './ui';

export function EpisodeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addNote } = useStore();
  const [text, setText] = useState('');
  const [anxiety, setAnxiety] = useState<number | null>(null);
  const [dizziness, setDizziness] = useState<number | null>(null);
  const [gut, setGut] = useState<number | null>(null);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [weather, setWeather] = useState<WeatherSnap | null>(null);
  const fetching = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setText('');
    setAnxiety(null);
    setDizziness(null);
    setGut(null);
    setTriggers([]);
    setWeather(null);
    if (!fetching.current) {
      fetching.current = true;
      getWeatherSnapshot().then((w) => {
        setWeather(w);
        fetching.current = false;
      });
    }
  }, [visible]);

  const toggle = (t: string) =>
    setTriggers((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t]));

  const save = () => {
    if (!text.trim()) return;
    addNote({
      kind: 'episode',
      text: text.trim(),
      anxiety: anxiety ?? undefined,
      dizziness: dizziness ?? undefined,
      gut: gut ?? undefined,
      triggers,
      weather: weather ?? undefined,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Record an episode"
      subtitle="Timed and stamped automatically. Write what your body did, not just how it felt."
    >
      <div className="col" style={{ gap: 16 }}>
        <Field
          value={text}
          onChange={setText}
          multiline
          minHeight={120}
          autoFocus
          placeholder="What happened? First sensation, what you thought, what you did, how it passed…"
        />

        <div>
          <SectionLabel>Anxiety level (0–10)</SectionLabel>
          <LevelScale value={anxiety} onChange={setAnxiety} low="none" high="worst" />
        </div>

        <div>
          <SectionLabel>Dizziness (0–10)</SectionLabel>
          <LevelScale value={dizziness} onChange={setDizziness} low="none" high="severe" />
        </div>

        <div>
          <SectionLabel>Gut comfort (0–10)</SectionLabel>
          <LevelScale value={gut} onChange={setGut} low="uncomfortable" high="comfortable" />
        </div>

        <div>
          <SectionLabel>What seemed to trigger it?</SectionLabel>
          <div className="wrap">
            {EPISODE_TRIGGERS.map((t) => (
              <Chip key={t} label={t} on={triggers.includes(t)} onPress={() => toggle(t)} />
            ))}
          </div>
        </div>

        {weather ? (
          <div className="row" style={{ gap: 6, color: 'var(--text-faint)' }}>
            <Icon name="weather" size={15} color="#6F7F9A" />
            <span className="tiny">
              {weather.tempC}°C · {weather.pressureHpa} hPa · {weather.trendLabel}
            </span>
          </div>
        ) : (
          <div className="row" style={{ gap: 6, color: 'var(--text-faint)' }}>
            <Icon name="weather" size={15} color="#6F7F9A" />
            <span className="tiny">Allow location once to auto-stamp weather with each episode</span>
          </div>
        )}

        <Button
          label="Save episode"
          onPress={save}
          disabled={!text.trim()}
          icon={<Icon name="check" size={17} color={text.trim() ? 'var(--accent-ink)' : '#6F7F9A'} />}
        />
      </div>
    </Modal>
  );
}
