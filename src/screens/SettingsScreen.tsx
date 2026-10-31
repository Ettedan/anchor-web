import { useRef, useState } from 'react';
import { CRISIS, SCOPE_NOTE } from '../content';
import { Icon } from '../components/Icon';
import { Button, Field, SectionLabel } from '../components/ui';
import { useStore } from '../store';
import { nowIso } from '../util';

export function SettingsScreen() {
  const {
    data,
    updateSettings,
    clearAll,
    exportJson,
    importJson,
    syncConfig,
    syncState,
    syncError,
    connectSync,
    disconnectSync,
    syncNow,
  } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showSetup, setShowSetup] = useState(false);
  const [owner, setOwner] = useState('Ettedan');
  const [repo, setRepo] = useState('anchor-data');
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anchor-backup-${nowIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importJson(String(reader.result ?? ''));
      setMsg(ok ? 'Imported. Your data is back.' : 'That file did not look like an Anchor backup.');
      setTimeout(() => setMsg(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="screen">
      <h1 className="h1">Settings</h1>
      <p className="small dim" style={{ marginTop: 4 }}>
        {syncConfig
          ? 'Saved on this device, and copied to your private repo while sync is on.'
          : 'Saved on this device only. Nothing is uploaded while sync is off.'}
      </p>

      <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Caffeine</div>
      <div className="card col" style={{ gap: 14 }}>
        <div className="grid2">
          <div>
            <SectionLabel>Daily target (mg)</SectionLabel>
            <Field
              value={String(data.settings.caffeineTargetMg)}
              onChange={(v) => {
                const n = Number(v);
                if (!Number.isNaN(n) && n >= 0) updateSettings({ caffeineTargetMg: n });
              }}
              type="number"
            />
          </div>
          <div>
            <SectionLabel>Last cup before</SectionLabel>
            <Field value={data.settings.caffeineCutoff} onChange={(v) => updateSettings({ caffeineCutoff: v })} type="time" />
          </div>
        </div>
        <p className="tiny dim">
          A standard coffee is ~100 mg. The aim is to get under your target and nothing after the cutoff,
          because caffeine stays in your system about 5 hours.
        </p>
      </div>

      <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Sleep</div>
      <div className="card col" style={{ gap: 10 }}>
        <div>
          <SectionLabel>Wake anchor</SectionLabel>
          <Field value={data.settings.wakeAnchor} onChange={(v) => updateSettings({ wakeAnchor: v })} type="time" />
        </div>
        <p className="tiny dim">
          A fixed wake time matters more than a fixed bedtime. Getting up at the same time every day,
          with light in your eyes, is the lever that resets the body clock.
        </p>
      </div>

      <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Sync between devices</div>
      <div className="card col" style={{ gap: 12 }}>
        {syncConfig ? (
          <>
            <div className="row">
              <div className="grow">
                <p style={{ fontWeight: 600 }}>
                  {syncState === 'syncing'
                    ? 'Syncing…'
                    : syncState === 'error'
                    ? 'Sync problem'
                    : 'Synced'}
                </p>
                <p className="tiny dim">
                  {syncConfig.owner}/{syncConfig.repo}
                  {syncConfig.lastSync
                    ? ` · last ${new Date(syncConfig.lastSync).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : ''}
                </p>
              </div>
              <span
                className="entry-dot"
                style={{
                  background:
                    syncState === 'error'
                      ? 'var(--coral)'
                      : syncState === 'syncing'
                      ? 'var(--amber)'
                      : 'var(--accent)',
                  width: 10,
                  height: 10,
                }}
              />
            </div>
            {syncError ? (
              <p className="small" style={{ color: 'var(--coral)' }}>{syncError}</p>
            ) : null}
            <div className="row" style={{ gap: 8 }}>
              <div className="grow">
                <Button label="Sync now" variant="soft" onPress={() => void syncNow()} />
              </div>
              <div className="grow">
                <Button label="Disconnect" variant="ghost" onPress={disconnectSync} />
              </div>
            </div>
            <p className="tiny faint">
              Your token is stored on this device only. Disconnect removes it here; the data stays in
              your private repo.
            </p>
          </>
        ) : (
          <>
            <p className="small dim">
              Turn on sync to keep the same records on your phone and your computer. Data is written to
              a private GitHub repo that only your token can read.
            </p>
            {!showSetup ? (
              <Button label="Set up sync" variant="soft" onPress={() => setShowSetup(true)} />
            ) : (
              <>
                <ol className="small dim" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                  <li>
                    Open{' '}
                    <a
                      href="https://github.com/settings/personal-access-tokens/new"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent)' }}
                    >
                      a new fine-grained token
                    </a>
                  </li>
                  <li>Repository access → <b>Only select repositories</b> → <b>{repo}</b></li>
                  <li>Permissions → <b>Contents: Read and write</b></li>
                  <li>Generate, copy it, and paste below</li>
                </ol>
                <div className="grid2">
                  <div>
                    <SectionLabel>Owner</SectionLabel>
                    <Field value={owner} onChange={setOwner} />
                  </div>
                  <div>
                    <SectionLabel>Private repo</SectionLabel>
                    <Field value={repo} onChange={setRepo} />
                  </div>
                </div>
                <div>
                  <SectionLabel>Token</SectionLabel>
                  <Field value={token} onChange={setToken} placeholder="github_pat_…" />
                </div>
                {syncError ? (
                  <p className="small" style={{ color: 'var(--coral)' }}>{syncError}</p>
                ) : null}
                <Button
                  label={connecting ? 'Connecting…' : 'Connect'}
                  onPress={async () => {
                    setConnecting(true);
                    try {
                      await connectSync(owner.trim(), repo.trim(), token.trim());
                      setShowSetup(false);
                      setToken('');
                      setMsg('Sync is on.');
                      setTimeout(() => setMsg(null), 3000);
                    } catch {
                      /* error already surfaced via syncError */
                    } finally {
                      setConnecting(false);
                    }
                  }}
                  disabled={connecting || !token.trim() || !owner.trim() || !repo.trim()}
                />
                <p className="tiny faint">
                  The token never leaves this device except to talk to GitHub. Use a private repo —
                  a public one would expose your notes.
                </p>
              </>
            )}
          </>
        )}
      </div>

      <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Your data</div>
      <div className="card col" style={{ gap: 10 }}>
        <div className="row">
          <div className="grow">
            <p style={{ fontWeight: 600 }}>Back up</p>
            <p className="tiny dim">Download a file you can restore from. Do this now and then.</p>
          </div>
          <Button label="Export" variant="soft" icon={<Icon name="download" size={16} color="var(--text)" />} onPress={download} />
        </div>
        <div className="row">
          <div className="grow">
            <p style={{ fontWeight: 600 }}>Restore</p>
            <p className="tiny dim">Load a backup file. This replaces what is on this device.</p>
          </div>
          <Button label="Import" variant="soft" icon={<Icon name="upload" size={16} color="var(--text)" />} onPress={() => fileRef.current?.click()} />
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }}
          />
        </div>
        {msg ? <p className="small" style={{ color: 'var(--accent)' }}>{msg}</p> : null}
        <Button
          label={confirming ? 'Tap again to delete everything' : 'Clear all data'}
          variant="danger"
          icon={<Icon name="trash" size={16} color="var(--coral)" />}
          onPress={() => {
            if (!confirming) {
              setConfirming(true);
              return;
            }
            clearAll();
            setConfirming(false);
          }}
        />
        {confirming ? (
          <button onClick={() => setConfirming(false)} className="small faint" style={{ textAlign: 'center' }}>
            Keep my data
          </button>
        ) : null}
        <p className="tiny faint">
          Data lives in this browser's storage. To help the browser keep it, install Anchor to your home
          screen (Share → Add to Home Screen), and export a backup regularly.
        </p>
      </div>

      <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Crisis resources</div>
      <div className="card col" style={{ gap: 12 }}>
        {CRISIS.map((c) => (
          <a key={c.label} href={c.action} className="row" style={{ textDecoration: 'none', gap: 10 }}>
            <Icon name="phone" size={18} color="var(--accent)" />
            <div className="grow">
              <p style={{ fontWeight: 600, color: 'var(--text)' }}>{c.label}</p>
              <p className="tiny dim">{c.detail}</p>
            </div>
            <span className="small" style={{ color: 'var(--accent)' }}>{c.actionLabel}</span>
          </a>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16, background: 'rgba(127,169,255,0.06)' }}>
        <p className="small dim">{SCOPE_NOTE}</p>
      </div>

      <p className="tiny faint" style={{ marginTop: 16, textAlign: 'center' }}>
        Anchor · v1.1 · local-first, sync optional
      </p>
    </div>
  );
}
