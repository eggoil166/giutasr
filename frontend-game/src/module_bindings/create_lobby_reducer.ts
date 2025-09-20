/* eslint-disable */
// Copied create_lobby_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type CreateLobby = { code: string };
export namespace CreateLobby {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('code', AlgebraicType.createStringType()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: CreateLobby): void { CreateLobby.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): CreateLobby { return CreateLobby.getTypeScriptAlgebraicType().deserialize(reader); }
}
