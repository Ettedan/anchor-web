import type { AppData } from './types';

/**
 * Sync via the GitHub Contents API against a **private** repo.
 *
 * Why this and not a backend: the app stays a static site on GitHub Pages, there is
 * no server to keep alive, and the data sits in a repo only this token can read.
 * Trade-off: the token is stored on the device, so it is only as safe as the device.
 */

const API = 'https://api.github.com';
const FILE = 'anchor-data.json';

export type SyncConfig = {
  owner: string;
  repo: string;
  token: string;
  /** ISO time of the last successful push or pull */
  lastSync: number | null;
};

const CONFIG_KEY = 'anchor-sync:v1';

export function loadSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as SyncConfig;
    if (!c.owner || !c.repo || !c.token) return null;
    return c;
  } catch {
    return null;
  }
}

export function saveSyncConfig(config: SyncConfig | null): void {
  if (!config) {
    localStorage.removeItem(CONFIG_KEY);
    return;
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

/* ------------------------------------------------------------- base64 */

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ---------------------------------------------------------------- api */

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export type RemoteFile = { data: AppData | null; sha: string | null };

/** Read the remote file. Returns null data when it does not exist yet. */
export async function pullRemote(config: SyncConfig): Promise<RemoteFile> {
  const url = `${API}/repos/${config.owner}/${config.repo}/contents/${FILE}`;
  const res = await fetch(url, { headers: headers(config.token), cache: 'no-store' });

  if (res.status === 404) return { data: null, sha: null };
  if (!res.ok) throw new Error(await describe(res));

  const json = await res.json();
  const text = fromBase64(json.content ?? '');
  try {
    return { data: JSON.parse(text) as AppData, sha: json.sha as string };
  } catch {
    // A corrupt remote file should not brick the app; treat it as absent.
    return { data: null, sha: json.sha as string };
  }
}

/** Write the whole document. Pass the sha to overwrite; omit to create. */
export async function pushRemote(
  config: SyncConfig,
  data: AppData,
  sha: string | null
): Promise<string> {
  const url = `${API}/repos/${config.owner}/${config.repo}/contents/${FILE}`;
  const body: Record<string, unknown> = {
    message: `anchor sync ${new Date().toISOString()}`,
    content: toBase64(JSON.stringify(data, null, 2)),
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(config.token),
    body: JSON.stringify(body),
  });

  if (res.status === 409) throw new ConflictError();
  if (!res.ok) throw new Error(await describe(res));

  const json = await res.json();
  return json.content.sha as string;
}

/** Validate a token + repo combo without writing anything. */
export async function testConnection(config: SyncConfig): Promise<string> {
  const url = `${API}/repos/${config.owner}/${config.repo}`;
  const res = await fetch(url, { headers: headers(config.token), cache: 'no-store' });
  if (res.status === 401) throw new Error('That token was rejected. Check it was copied fully and has not expired.');
  if (res.status === 404) throw new Error(`Repo ${config.owner}/${config.repo} not found, or the token cannot see it.`);
  if (!res.ok) throw new Error(await describe(res));
  const json = await res.json();
  if (!json.private) throw new Error('That repo is public. Use a private repo — the data is not encrypted.');
  return json.full_name as string;
}

export class ConflictError extends Error {
  constructor() {
    super('Remote changed since we last read it.');
    this.name = 'ConflictError';
  }
}

async function describe(res: Response): Promise<string> {
  if (res.status === 403) return 'GitHub refused the request (403). The token needs Contents: read and write on this repo.';
  try {
    const j = await res.json();
    return `GitHub error ${res.status}: ${j.message ?? 'unknown'}`;
  } catch {
    return `GitHub error ${res.status}`;
  }
}

/* -------------------------------------------------------------- merge */

/**
 * Union by id, honour tombstones, newest settings win.
 * Records are append-only with unique ids, so a union cannot lose data;
 * deletions are tracked separately so they are not resurrected.
 */
export function mergeData(local: AppData, remote: AppData): AppData {
  const deleted: Record<string, number> = { ...remote.deleted, ...local.deleted };
  for (const [id, at] of Object.entries(remote.deleted ?? {})) {
    deleted[id] = Math.max(at, deleted[id] ?? 0);
  }

  const byId = <T extends { id: string }>(a: T[], b: T[]): T[] => {
    const map = new Map<string, T>();
    for (const item of b) map.set(item.id, item);
    for (const item of a) map.set(item.id, item);
    return [...map.values()].sort((x, y) => (y as { at?: number }).at! - (x as { at?: number }).at!);
  };

  const entries = byId(local.entries, remote.entries).filter((e) => !(e.id in deleted));
  const notes = byId(local.notes, remote.notes).filter((n) => !(n.id in deleted));

  const localNewer = (local.updatedAt ?? 0) >= (remote.updatedAt ?? 0);

  return {
    version: 2,
    entries,
    notes,
    settings: localNewer ? local.settings : remote.settings,
    deleted,
    updatedAt: Math.max(local.updatedAt ?? 0, remote.updatedAt ?? 0),
  };
}
