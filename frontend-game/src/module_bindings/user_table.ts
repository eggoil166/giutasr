/* eslint-disable */
// Copied user_table binding
// @ts-nocheck
import { TableCache, deepEqual, Identity } from '@clockworklabs/spacetimedb-sdk';
import { User } from './user_type';
import { type EventContext } from '.';

export class UserTableHandle {
  tableCache: TableCache<User>;
  constructor(tableCache: TableCache<User>) { this.tableCache = tableCache; }
  count(): number { return this.tableCache.count(); }
  iter(): Iterable<User> { return this.tableCache.iter(); }
  identity = { find: (col_val: Identity): User | undefined => { for (let row of this.tableCache.iter()) { if (deepEqual(row.identity, col_val)) return row; } } };
  onInsert = (cb: (ctx: EventContext, row: User) => void) => this.tableCache.onInsert(cb);
  removeOnInsert = (cb: (ctx: EventContext, row: User) => void) => this.tableCache.removeOnInsert(cb);
  onDelete = (cb: (ctx: EventContext, row: User) => void) => this.tableCache.onDelete(cb);
  removeOnDelete = (cb: (ctx: EventContext, row: User) => void) => this.tableCache.removeOnDelete(cb);
  onUpdate = (cb: (ctx: EventContext, oldRow: User, newRow: User) => void) => this.tableCache.onUpdate(cb);
  removeOnUpdate = (cb: (ctx: EventContext, oldRow: User, newRow: User) => void) => this.tableCache.removeOnUpdate(cb);
}
