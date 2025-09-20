/* eslint-disable */
// Copied client_connected_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type ClientConnected = {};
export namespace ClientConnected {
  export function getTypeScriptAlgebraicType(): AlgebraicType { return AlgebraicType.createProductType([]); }
  export function serialize(writer: BinaryWriter, value: ClientConnected): void { ClientConnected.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): ClientConnected { return ClientConnected.getTypeScriptAlgebraicType().deserialize(reader); }
}
