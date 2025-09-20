import { DbConnection, type ErrorContext, type EventContext, type Lobby } from '../module_bindings';

export type SpacetimeState = {
  conn: DbConnection | null;
  identity: unknown | null;
  connected: boolean;
  error: string | null;
};

let currentConn: DbConnection | null = null;
let currentIdentity: unknown | null = null;

export async function connectSpacetime(savedToken?: string): Promise<SpacetimeState> {
  return new Promise((resolve) => {
  const uri = (import.meta.env.VITE_STDB_URI as string | undefined)?.trim();
  const moduleName = (import.meta.env.VITE_STDB_MODULE as string | undefined)?.trim();
    const debug = (import.meta.env.VITE_DEBUG_SPACETIMEDB === 'true');

    const state: SpacetimeState = { conn: null, identity: null, connected: false, error: null };
    let resolved = false;

    if (!uri || !moduleName) {
      state.error = 'Missing VITE_STDB_URI or VITE_STDB_MODULE';
      resolved = true; resolve(state);
      return;
    }

    if (debug) {
      console.log('[SpaceTimeDB] Attempt connect', { uri, moduleName, savedToken: !!savedToken });
    }

    const builder = DbConnection.builder()
      .withUri(uri)
      .withModuleName(moduleName)
      .withToken(savedToken)
      .onConnect((c: unknown, id: unknown, token: string) => {
        try { localStorage.setItem('auth_token', token); } catch { /* ignore */ }
        state.conn = c as DbConnection;
        state.identity = id;
        state.connected = true;
        currentConn = c as DbConnection;
        currentIdentity = id;
        // Defer subscription until connection is fully established to avoid DOMException
  try {
          (c as DbConnection).subscriptionBuilder().subscribe(['SELECT * FROM user']);
          if (debug) console.log('[SpaceTimeDB] Presence subscription registered');
        } catch (e) {
          if (debug) console.warn('[SpaceTimeDB] Initial subscription failed, retrying shortly', e);
          setTimeout(() => {
            try { (c as DbConnection).subscriptionBuilder().subscribe(['SELECT * FROM user']); if (debug) console.log('[SpaceTimeDB] Presence subscription retry OK'); } catch {/* ignore */}
          }, 300);
        }
        if (!resolved) { resolved = true; resolve(state); }
      })
      .onConnectError((_ctx: ErrorContext, err: Error) => {
        state.error = err instanceof Error ? err.message : 'Connect error';
        if (!resolved) { resolved = true; resolve(state); }
      })
      .onDisconnect(() => { state.connected = false; if (debug) console.log('[SpaceTimeDB] Disconnected'); });

    try {
      const conn = builder.build();
      currentConn = conn;
      state.conn = conn;
    } catch (e) {
      state.error = e instanceof Error ? e.message : 'Build connection failed';
      if (!resolved) { resolved = true; resolve(state); }
      return;
    }

    setTimeout(() => {
      if (!resolved && !state.connected) {
        state.error = 'Timeout connecting to SpaceTimeDB';
        resolved = true; resolve(state);
      }
    }, 6000);
  });
}

export function getConn(): DbConnection | null { return currentConn; }
export function getIdentity(): unknown | null { return currentIdentity; }

export const LobbyApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(conn: DbConnection, code: string) { (conn as any).reducers.createLobby(code); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  join(conn: DbConnection, code: string) { (conn as any).reducers.joinLobby(code); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCharacter(conn: DbConnection, code: string, character: string) { (conn as any).reducers.setCharacter?.(code, character); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setReady(conn: DbConnection, code: string, ready: boolean) { (conn as any).reducers.setReady?.(code, ready); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSong(conn: DbConnection, code: string, songId: string) { (conn as any).reducers.setSong?.(code, songId); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startMatch(conn: DbConnection, code: string) { (conn as any).reducers.startMatch?.(code); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setScore(conn: DbConnection, code: string, score: number) { (conn as any).reducers.setScore?.(code, score); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateGameState(conn: DbConnection, code: string, bearProgress: number, manProgress: number, gameOver: boolean, gameResult?: string) { 
    (conn as any).reducers.updateGameState?.(code, bearProgress, manProgress, gameOver, gameResult); 
  },
};

export function subscribeLobby(code: string, onChange: (row: Lobby | null) => void): () => void {
  const conn = getConn();
  if (!conn) return () => {};
  const CODE = code.toUpperCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rt = conn as any;
  const onInsert = (_ctx: EventContext, row: Lobby) => { if (row.code.toUpperCase() === CODE) onChange(row); };
  const onUpdate = (_ctx: EventContext, _old: Lobby, row: Lobby) => { if (row.code.toUpperCase() === CODE) onChange(row); };
  const onDelete = (_ctx: EventContext, row: Lobby) => { if (row.code.toUpperCase() === CODE) onChange(null); };
  rt.db.lobby.onInsert(onInsert);
  rt.db.lobby.onUpdate(onUpdate);
  rt.db.lobby.onDelete(onDelete);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub: any = conn.subscriptionBuilder();
  if (typeof sub.onApplied === 'function') { sub.onApplied(() => { const row = rt.db.lobby.code.find(CODE) || null; onChange(row); }); }
  sub.subscribe([`SELECT * FROM lobby WHERE code='${CODE}'`]);
  return () => {
    rt.db.lobby.removeOnInsert(onInsert);
    rt.db.lobby.removeOnUpdate(onUpdate);
    rt.db.lobby.removeOnDelete(onDelete);
  };
}
