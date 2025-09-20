/* eslint-disable */
// Copied client_disconnected_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type ClientDisconnected = {};
export namespace ClientDisconnected {
  export function getTypeScriptAlgebraicType(): AlgebraicType { return AlgebraicType.createProductType([]); }
  export function serialize(writer: BinaryWriter, value: ClientDisconnected): void { ClientDisconnected.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): ClientDisconnected { return ClientDisconnected.getTypeScriptAlgebraicType().deserialize(reader); }
}
