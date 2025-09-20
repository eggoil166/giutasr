/* eslint-disable */
// Copied join_lobby_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type JoinLobby = { code: string };
export namespace JoinLobby {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('code', AlgebraicType.createStringType()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: JoinLobby): void { JoinLobby.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): JoinLobby { return JoinLobby.getTypeScriptAlgebraicType().deserialize(reader); }
}
