// Copied SpaceTimeDB generated bindings (index)
// NOTE: If you regenerate the module, re-copy these files.
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
import {
  AlgebraicType,
  AlgebraicValue,
  BinaryReader,
  BinaryWriter,
  ConnectionId,
  DbConnectionBuilder,
  DbConnectionImpl,
  Identity,
  ProductType,
  ProductTypeElement,
  SubscriptionBuilderImpl,
  SumType,
  SumTypeVariant,
  TableCache,
  TimeDuration,
  Timestamp,
  deepEqual,
  type CallReducerFlags,
  type DbContext,
  type ErrorContextInterface,
  type Event,
  type EventContextInterface,
  type ReducerEventContextInterface,
  type SubscriptionEventContextInterface,
} from '@clockworklabs/spacetimedb-sdk';

import { ClientConnected } from './client_connected_reducer';
export { ClientConnected };
import { ClientDisconnected } from './client_disconnected_reducer';
export { ClientDisconnected };
import { CreateLobby } from './create_lobby_reducer';
export { CreateLobby };
import { JoinLobby } from './join_lobby_reducer';
export { JoinLobby };
import { Increment } from './increment_reducer';
export { Increment };
import { SetCharacter } from './set_character_reducer';
export { SetCharacter };
import { SetReady } from './set_ready_reducer';
export { SetReady };
import { SetSong } from './set_song_reducer';
export { SetSong };
import { StartMatch } from './start_match_reducer';
export { StartMatch };
import { SetScore } from './set_score_reducer';
export { SetScore };

import { LobbyTableHandle } from './lobby_table';
export { LobbyTableHandle };
import { UserTableHandle } from './user_table';
export { UserTableHandle };

import { Lobby } from './lobby_type';
export { Lobby };
import { User } from './user_type';
export { User };

const REMOTE_MODULE = {
  tables: {
    lobby: {
      tableName: 'lobby',
      rowType: Lobby.getTypeScriptAlgebraicType(),
      primaryKey: 'code',
      primaryKeyInfo: {
        colName: 'code',
        colType: Lobby.getTypeScriptAlgebraicType().product.elements[0].algebraicType,
      },
    },
    user: {
      tableName: 'user',
      rowType: User.getTypeScriptAlgebraicType(),
      primaryKey: 'identity',
      primaryKeyInfo: {
        colName: 'identity',
        colType: User.getTypeScriptAlgebraicType().product.elements[0].algebraicType,
      },
    },
  },
  reducers: {
    client_connected: {
      reducerName: 'client_connected',
      argsType: ClientConnected.getTypeScriptAlgebraicType(),
    },
    client_disconnected: {
      reducerName: 'client_disconnected',
      argsType: ClientDisconnected.getTypeScriptAlgebraicType(),
    },
    create_lobby: {
      reducerName: 'create_lobby',
      argsType: CreateLobby.getTypeScriptAlgebraicType(),
    },
    join_lobby: {
      reducerName: 'join_lobby',
      argsType: JoinLobby.getTypeScriptAlgebraicType(),
    },
    increment: {
      reducerName: 'increment',
      argsType: Increment.getTypeScriptAlgebraicType(),
    },
    set_character: {
      reducerName: 'set_character',
      argsType: SetCharacter.getTypeScriptAlgebraicType(),
    },
    set_ready: {
      reducerName: 'set_ready',
      argsType: SetReady.getTypeScriptAlgebraicType(),
    },
    set_song: {
      reducerName: 'set_song',
      argsType: SetSong.getTypeScriptAlgebraicType(),
    },
    start_match: {
      reducerName: 'start_match',
      argsType: StartMatch.getTypeScriptAlgebraicType(),
    },
    set_score: {
      reducerName: 'set_score',
      argsType: SetScore.getTypeScriptAlgebraicType(),
    },
  },
  versionInfo: {
    cliVersion: '1.3.2',
  },
  eventContextConstructor: (imp: DbConnectionImpl, event: Event<Reducer>) => {
    return {
      ...(imp as DbConnection),
      event,
    };
  },
  dbViewConstructor: (imp: DbConnectionImpl) => {
    return new RemoteTables(imp);
  },
  reducersConstructor: (imp: DbConnectionImpl, setReducerFlags: SetReducerFlags) => {
    return new RemoteReducers(imp, setReducerFlags);
  },
  setReducerFlagsConstructor: () => {
    return new SetReducerFlags();
  },
};

export type Reducer =
  | { name: 'ClientConnected'; args: ClientConnected }
  | { name: 'ClientDisconnected'; args: ClientDisconnected }
  | { name: 'CreateLobby'; args: CreateLobby }
  | { name: 'JoinLobby'; args: JoinLobby }
  | { name: 'Increment'; args: Increment }
  | { name: 'SetCharacter'; args: SetCharacter }
  | { name: 'SetReady'; args: SetReady }
  | { name: 'SetSong'; args: SetSong }
  | { name: 'StartMatch'; args: StartMatch }
  | { name: 'SetScore'; args: SetScore };

export class RemoteReducers {
  constructor(private connection: DbConnectionImpl, private setCallReducerFlags: SetReducerFlags) {}

  onClientConnected(callback: (ctx: ReducerEventContext) => void) {
    this.connection.onReducer('client_connected', callback);
  }
  removeOnClientConnected(callback: (ctx: ReducerEventContext) => void) {
    this.connection.offReducer('client_connected', callback);
  }
  onClientDisconnected(callback: (ctx: ReducerEventContext) => void) {
    this.connection.onReducer('client_disconnected', callback);
  }
  removeOnClientDisconnected(callback: (ctx: ReducerEventContext) => void) {
    this.connection.offReducer('client_disconnected', callback);
  }
  createLobby(code: string) {
    const __args = { code };
    let __writer = new BinaryWriter(1024);
    CreateLobby.getTypeScriptAlgebraicType().serialize(__writer, __args);
    let __argsBuffer = __writer.getBuffer();
    this.connection.callReducer('create_lobby', __argsBuffer, this.setCallReducerFlags.createLobbyFlags);
  }
  joinLobby(code: string) {
    const __args = { code };
    let __writer = new BinaryWriter(1024);
    JoinLobby.getTypeScriptAlgebraicType().serialize(__writer, __args);
    let __argsBuffer = __writer.getBuffer();
    this.connection.callReducer('join_lobby', __argsBuffer, this.setCallReducerFlags.joinLobbyFlags);
  }
  increment(code: string) {
    const __args = { code };
    let __writer = new BinaryWriter(1024);
    Increment.getTypeScriptAlgebraicType().serialize(__writer, __args);
    let __argsBuffer = __writer.getBuffer();
    this.connection.callReducer('increment', __argsBuffer, this.setCallReducerFlags.incrementFlags);
  }
  setCharacter(code: string, character: string) {
    const __args = { code, character };
    let __writer = new BinaryWriter(1024);
    SetCharacter.getTypeScriptAlgebraicType().serialize(__writer, __args);
    let __argsBuffer = __writer.getBuffer();
    this.connection.callReducer('set_character', __argsBuffer, this.setCallReducerFlags.setCharacterFlags);
  }
  setReady(code: string, ready: boolean) {
    const __args = { code, ready };
    let __writer = new BinaryWriter(1024);
    SetReady.getTypeScriptAlgebraicType().serialize(__writer, __args);
    let __argsBuffer = __writer.getBuffer();
    this.connection.callReducer('set_ready', __argsBuffer, this.setCallReducerFlags.setReadyFlags);
  }
  setSong(code: string, song_id: string) {
    const __args = { code, song_id };
    let __writer = new BinaryWriter(1024);
    SetSong.getTypeScriptAlgebraicType().serialize(__writer, __args);
    let __argsBuffer = __writer.getBuffer();
    this.connection.callReducer('set_song', __argsBuffer, this.setCallReducerFlags.setSongFlags);
  }
  startMatch(code: string) {
    const __args = { code };
    let __writer = new BinaryWriter(1024);
    StartMatch.getTypeScriptAlgebraicType().serialize(__writer, __args);
    let __argsBuffer = __writer.getBuffer();
    this.connection.callReducer('start_match', __argsBuffer, this.setCallReducerFlags.startMatchFlags);
  }
  setScore(code: string, score: number) {
    const __args = { code, score };
    let __writer = new BinaryWriter(1024);
    SetScore.getTypeScriptAlgebraicType().serialize(__writer, __args);
    let __argsBuffer = __writer.getBuffer();
    this.connection.callReducer('set_score', __argsBuffer, this.setCallReducerFlags.setScoreFlags);
  }
}

export class SetReducerFlags {
  createLobbyFlags: CallReducerFlags = 'FullUpdate';
  createLobby(flags: CallReducerFlags) { this.createLobbyFlags = flags; }
  joinLobbyFlags: CallReducerFlags = 'FullUpdate';
  joinLobby(flags: CallReducerFlags) { this.joinLobbyFlags = flags; }
  incrementFlags: CallReducerFlags = 'FullUpdate';
  increment(flags: CallReducerFlags) { this.incrementFlags = flags; }
  setCharacterFlags: CallReducerFlags = 'FullUpdate';
  setCharacter(flags: CallReducerFlags) { this.setCharacterFlags = flags; }
  setReadyFlags: CallReducerFlags = 'FullUpdate';
  setReady(flags: CallReducerFlags) { this.setReadyFlags = flags; }
  setSongFlags: CallReducerFlags = 'FullUpdate';
  setSong(flags: CallReducerFlags) { this.setSongFlags = flags; }
  startMatchFlags: CallReducerFlags = 'FullUpdate';
  startMatch(flags: CallReducerFlags) { this.startMatchFlags = flags; }
  setScoreFlags: CallReducerFlags = 'FullUpdate';
  setScore(flags: CallReducerFlags) { this.setScoreFlags = flags; }
}

export class RemoteTables {
  constructor(private connection: DbConnectionImpl) {}
  get lobby(): LobbyTableHandle { return new LobbyTableHandle(this.connection.clientCache.getOrCreateTable<Lobby>(REMOTE_MODULE.tables.lobby)); }
  get user(): UserTableHandle { return new UserTableHandle(this.connection.clientCache.getOrCreateTable<User>(REMOTE_MODULE.tables.user)); }
}

export class SubscriptionBuilder extends SubscriptionBuilderImpl<RemoteTables, RemoteReducers, SetReducerFlags> {}
export class DbConnection extends DbConnectionImpl<RemoteTables, RemoteReducers, SetReducerFlags> {
  static builder = (): DbConnectionBuilder<DbConnection, ErrorContext, SubscriptionEventContext> => {
    return new DbConnectionBuilder<DbConnection, ErrorContext, SubscriptionEventContext>(REMOTE_MODULE, (imp: DbConnectionImpl) => imp as DbConnection);
  };
  subscriptionBuilder = (): SubscriptionBuilder => { return new SubscriptionBuilder(this); };
}
export type EventContext = EventContextInterface<RemoteTables, RemoteReducers, SetReducerFlags, Reducer>;
export type ReducerEventContext = ReducerEventContextInterface<RemoteTables, RemoteReducers, SetReducerFlags, Reducer>;
export type SubscriptionEventContext = SubscriptionEventContextInterface<RemoteTables, RemoteReducers, SetReducerFlags>;
export type ErrorContext = ErrorContextInterface<RemoteTables, RemoteReducers, SetReducerFlags>;
