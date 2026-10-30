import { useState } from 'react';
import { EpisodeModal } from './components/EpisodeModal';
import { Icon } from './components/Icon';
import type { IconName } from './components/Icon';
import { TrackerModal } from './components/TrackerModal';
import { JournalScreen } from './screens/JournalScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TodayScreen } from './screens/TodayScreen';
import { TrendsScreen } from './screens/TrendsScreen';
import { AnchorProvider } from './store';
import type { TrackKind } from './types';

type Tab = 'today' | 'journal' | 'trends' | 'settings';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'journal', label: 'Journal', icon: 'book' },
  { id: 'trends', label: 'Trends', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];

function Shell() {
  const [tab, setTab] = useState<Tab>('today');
  const [tracker, setTracker] = useState<TrackKind | null>(null);
  const [episode, setEpisode] = useState(false);

  return (
    <div className="app">
      {tab === 'today' ? (
        <TodayScreen onOpenTracker={setTracker} onOpenEpisode={() => setEpisode(true)} />
      ) : null}
      {tab === 'journal' ? <JournalScreen onOpenEpisode={() => setEpisode(true)} /> : null}
      {tab === 'trends' ? <TrendsScreen /> : null}
      {tab === 'settings' ? <SettingsScreen /> : null}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={23} color={tab === t.id ? 'var(--accent)' : 'var(--text-faint)'} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <TrackerModal kind={tracker} onClose={() => setTracker(null)} />
      <EpisodeModal visible={episode} onClose={() => setEpisode(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AnchorProvider>
      <Shell />
    </AnchorProvider>
  );
}
