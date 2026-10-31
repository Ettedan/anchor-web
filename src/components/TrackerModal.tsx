import { useEffect, useRef, useState } from 'react';
import { COFFEE_MG_PER_CUP, EXERCISE_TYPES, MEDITATION_TYPES } from '../content';
import { useStore } from '../store';
import type { TrackKind, WeatherSnap } from '../types';
import { fmtTime, sleepHours } from '../util';
import { getWeatherSnapshot } from '../weather';
import { Icon } from './Icon';
import { Button, Chip, Field, LevelScale, Modal, SectionLabel } from './ui';

export function TrackerModal({
  kind,
  onClose,
}: {
  kind: TrackKind | null;
  onClose: () => void;
}) {
  const { data, addEntry } = useStore();
  const [weather, setWeather] = useState<WeatherSnap | null>(null);
  const fetching = useRef(false);

  // generic
  const [note, setNote] = useState('');
  // exercise
  const [exerciseType, setExerciseType] = useState('Walk');
  const [minutes, setMinutes] = useState('20');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'strong'>('moderate');
  // meditation
  const [meditationType, setMeditationType] = useState('Breathing');
  // sleep
  const [bedtime, setBedtime] = useState('01:00');
  const [wake, setWake] = useState('09:00');
  const [quality, setQuality] = useState<number | null>(null);
  // coffee
  const [cups, setCups] = useState(1);
  const [coffeeTime, setCoffeeTime] = useState(fmtTime(Date.now()));
  // mood
  const [mood, setMood] = useState<number | null>(null);

  useEffect(() => {
    if (!kind) return;
    // reset per-kind state
    setNote('');
    setMood(null);
    setQuality(null);
    setMinutes('20');
    setIntensity('moderate');
    setCups(1);
    setExerciseType('Walk');
    setMeditationType('Breathing');
    setBedtime('01:00');
    setWake('09:00');
    setCoffeeTime(fmtTime(Date.now()));
    setWeather(null);
    if (!fetching.current) {
      fetching.current = true;
      getWeatherSnapshot().then((w) => {
        setWeather(w);
        fetching.current = false;
      });
    }
  }, [kind]);

  const hours = sleepHours(bedtime, wake);

  const canSave = () => {
    switch (kind) {
      case 'exercise': return minutes.trim() !== '' && Number(minutes) > 0;
      case 'meditation': return minutes.trim() !== '' && Number(minutes) > 0;
      case 'sleep': return bedtime !== '' && wake !== '' && quality !== null;
      case 'coffee': return cups > 0;
      case 'mood': return mood !== null;
      default: return false;
    }
  };

  const save = () => {
    if (!kind || !canSave()) return;
    const base = { note: note.trim() || undefined, weather: weather ?? undefined };
    switch (kind) {
      case 'exercise':
        addEntry({ kind, exerciseType, minutes: Number(minutes), intensity, ...base });
        break;
      case 'meditation':
        addEntry({ kind, meditationType, minutes: Number(minutes), ...base });
        break;
      case 'sleep':
        addEntry({ kind, bedtime, wake, hours: hours ?? undefined, sleepQuality: quality ?? undefined, ...base });
        break;
      case 'coffee':
        addEntry({ kind, cups, mg: cups * COFFEE_MG_PER_CUP, coffeeTime, ...base });
        break;
      case 'mood':
        addEntry({ kind, mood: mood ?? undefined, ...base });
        break;
    }
    onClose();
  };

  const title: Record<TrackKind, string> = {
    exercise: 'Exercise',
    meditation: 'Meditation',
    sleep: 'Sleep',
    coffee: 'Coffee',
    mood: 'How do you feel?',
  };
  const subtitle: Record<TrackKind, string> = {
    exercise: 'Movement helps, and a raised heart rate in a safe context is useful practice.',
    meditation: 'Eyes softly open or body scan tend to suit a sensitive inner ear best.',
    sleep: 'Log the night before when you wake. Bedtime and wake time are what matter.',
    coffee: `Target under ${data.settings.caffeineTargetMg} mg, last cup before ${data.settings.caffeineCutoff}.`,
    mood: '10 is calm. One number, no judgement.',
  };

  return (
    <Modal visible={!!kind} onClose={onClose} title={kind ? title[kind] : ''} subtitle={kind ? subtitle[kind] : undefined}>
      {kind === 'exercise' ? (
        <div className="col" style={{ gap: 16 }}>
          <div>
            <SectionLabel>Type</SectionLabel>
            <div className="wrap">
              {EXERCISE_TYPES.map((t) => (
                <Chip key={t} label={t} on={exerciseType === t} onPress={() => setExerciseType(t)} />
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>Minutes</SectionLabel>
            <Field value={minutes} onChange={setMinutes} type="number" placeholder="20" />
          </div>
          <div>
            <SectionLabel>How hard</SectionLabel>
            <div className="wrap">
              {(['light', 'moderate', 'strong'] as const).map((i) => (
                <Chip key={i} label={i} on={intensity === i} onPress={() => setIntensity(i)} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {kind === 'meditation' ? (
        <div className="col" style={{ gap: 16 }}>
          <div>
            <SectionLabel>Type</SectionLabel>
            <div className="wrap">
              {MEDITATION_TYPES.map((t) => (
                <Chip key={t} label={t} on={meditationType === t} onPress={() => setMeditationType(t)} />
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>Minutes</SectionLabel>
            <Field value={minutes} onChange={setMinutes} type="number" placeholder="10" />
          </div>
          <p className="small dim">
            If closed eyes make you dizzier, keep a soft gaze on the floor. Short and regular beats long and rare.
          </p>
        </div>
      ) : null}

      {kind === 'sleep' ? (
        <div className="col" style={{ gap: 16 }}>
          <div className="grid2">
            <div>
              <SectionLabel>Bedtime</SectionLabel>
              <Field value={bedtime} onChange={setBedtime} type="time" />
            </div>
            <div>
              <SectionLabel>Wake time</SectionLabel>
              <Field value={wake} onChange={setWake} type="time" />
            </div>
          </div>
          {hours !== null ? (
            <p className="small dim">≈ {hours} hours in bed.</p>
          ) : null}
          <div>
            <SectionLabel>How rested? (0–10)</SectionLabel>
            <LevelScale value={quality} onChange={setQuality} low="wrecked" high="rested" />
          </div>
        </div>
      ) : null}

      {kind === 'coffee' ? (
        <div className="col" style={{ gap: 16 }}>
          <div>
            <SectionLabel>Cups</SectionLabel>
            <div className="wrap">
              {[0.5, 1, 2, 3, 4].map((c) => (
                <Chip key={c} label={`${c}`} on={cups === c} onPress={() => setCups(c)} />
              ))}
            </div>
            <p className="small dim" style={{ marginTop: 8 }}>≈ {cups * COFFEE_MG_PER_CUP} mg</p>
          </div>
          <div>
            <SectionLabel>When</SectionLabel>
            <Field value={coffeeTime} onChange={setCoffeeTime} type="time" />
          </div>
          {coffeeTime > data.settings.caffeineCutoff ? (
            <p className="small" style={{ color: 'var(--amber)' }}>
              After your {data.settings.caffeineCutoff} cutoff — this one will still be in your system at night.
            </p>
          ) : null}
        </div>
      ) : null}

      {kind === 'mood' ? (
        <div>
          <LevelScale value={mood} onChange={setMood} low="rough" high="calm" />
        </div>
      ) : null}

      {kind ? (
        <div style={{ marginTop: 16 }}>
          <SectionLabel>Note (optional)</SectionLabel>
          <Field value={note} onChange={setNote} multiline minHeight={70} placeholder="Anything worth remembering about this one" />
        </div>
      ) : null}

      {weather ? (
        <div className="row" style={{ marginTop: 14, gap: 6, color: 'var(--text-faint)' }}>
          <Icon name="weather" size={15} color="#6F7F9A" />
          <span className="tiny">{weather.tempC}°C · {weather.pressureHpa} hPa · {weather.trendLabel}</span>
        </div>
      ) : (
        <div className="row" style={{ marginTop: 14, gap: 6, color: 'var(--text-faint)' }}>
          <Icon name="weather" size={15} color="#6F7F9A" />
          <span className="tiny">Allow location to record weather with each entry</span>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <Button label="Save" onPress={save} disabled={!canSave()} icon={<Icon name="check" size={17} color={canSave() ? 'var(--accent-ink)' : '#6F7F9A'} />} />
      </div>
    </Modal>
  );
}
