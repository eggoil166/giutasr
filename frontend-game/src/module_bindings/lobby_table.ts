/* eslint-disable */
// Copied lobby_table binding
// @ts-nocheck
import { TableCache, deepEqual, Identity } from '@clockworklabs/spacetimedb-sdk';
import { Lobby } from './lobby_type';
import { type EventContext } from '.';

export class LobbyTableHandle {
  tableCache: TableCache<Lobby>;
  constructor(tableCache: TableCache<Lobby>) { this.tableCache = tableCache; }
  count(): number { return this.tableCache.count(); }
  iter(): Iterable<Lobby> { return this.tableCache.iter(); }
  code = { find: (col_val: string): Lobby | undefined => { for (let row of this.tableCache.iter()) { if (row.code === col_val) return row; } } };
  onInsert = (cb: (ctx: EventContext, row: Lobby) => void) => this.tableCache.onInsert(cb);
  removeOnInsert = (cb: (ctx: EventContext, row: Lobby) => void) => this.tableCache.removeOnInsert(cb);
  onDelete = (cb: (ctx: EventContext, row: Lobby) => void) => this.tableCache.onDelete(cb);
  removeOnDelete = (cb: (ctx: EventContext, row: Lobby) => void) => this.tableCache.removeOnDelete(cb);
  onUpdate = (cb: (ctx: EventContext, oldRow: Lobby, newRow: Lobby) => void) => this.tableCache.onUpdate(cb);
  removeOnUpdate = (cb: (ctx: EventContext, oldRow: Lobby, newRow: Lobby) => void) => this.tableCache.removeOnUpdate(cb);
}
