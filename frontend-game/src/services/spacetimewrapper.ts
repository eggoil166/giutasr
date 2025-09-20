import { DbConnection, type ErrorContext, type EventContext, type Lobby } from "../../../module_bindings/index.ts"

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
    const uri = "https://maincloud.spacetimedb.com";
    const moduleName = "guitars";
    const state: SpacetimeState = { conn: null, identity: null, connected: false, error: null };
    let resolved = false;

    const builder = DbConnection.builder()
      .withUri(uri)
      .withModuleName(moduleName)
      .withToken(savedToken)
  .onConnect((c: unknown, id: unknown, token: string) => {
        try { localStorage.setItem('auth_token', token); } catch { /* ignore quota/unavailable */ }
  state.conn = c as DbConnection;
        state.identity = id;
        state.connected = true;
  currentConn = c as DbConnection;
        currentIdentity = id;
        if (!resolved) { resolved = true; resolve(state); }
      })
      .onConnectError((_ctx: ErrorContext, err: Error) => {
        state.error = err instanceof Error ? err.message : 'Connect error';
        if (!resolved) { resolved = true; resolve(state); }
      })
      .onDisconnect(() => {
        state.connected = false;
      });

    const conn = builder.build();
    currentConn = conn;
    state.conn = conn;

    // Always subscribe to user presence
    conn.subscriptionBuilder().subscribe(['SELECT * FROM user']);

    // Timeout as a fallback
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
    create(conn: DbConnection, code: string, hostRole: string) { (conn as any).reducers.createLobby(code, hostRole); },
    join(conn: DbConnection, code: string) { (conn as any).reducers.joinLobby(code); },
    setReady(conn: DbConnection, code: string, ready: boolean) { (conn as any).reducers.setReady?.(code, ready); },
    setSong(conn: DbConnection, code: string, songId: string) { (conn as any).reducers.setSong?.(code, songId); },
    startMatch(conn: DbConnection, code: string) { (conn as any).reducers.startMatch?.(code); },
    setscore(conn: DbConnection, code: string, score: number) { (conn as any).reducers.setScore?.(code, score); }
};

export function subscribeLobby(code: string, onChange: (row: Lobby | null) => void): () => void {
    const conn = getConn();
    if (!conn) return () => {};
    const CODE = code.toUpperCase();
    const rt = conn as any;
    const onInsert = (_ctx: EventContext, row: Lobby) => { if (row.code.toUpperCase() === CODE) onChange(row); };
    const onUpdate = (_ctx: EventContext, _old: Lobby, row: Lobby) => { if (row.code.toUpperCase() === CODE) onChange(row); };
    const onDelete = (_ctx: EventContext, row: Lobby) => { if (row.code.toUpperCase() === CODE) onChange(null); };
    rt.db.lobby.onInsert(onInsert);
    rt.db.lobby.onUpdate(onUpdate);
    rt.db.lobby.onDelete(onDelete);
    const sub: any = conn.subscriptionBuilder();
    if (typeof sub.onApplied === 'function') {
        sub.onApplied(() => {
            const row = rt.db.lobby.code.find(CODE) || null;
            onChange(row);
        });
    }
    sub.subscribe([`SELECT * FROM lobby WHERE code = '${CODE}'`]);

    return () => {
        rt.db.lobby.removeOnInsert(onInsert);
        rt.db.lobby.removeOnUpdate(onUpdate);
        rt.db.lobby.removeOnDelete(onDelete);
    }
}