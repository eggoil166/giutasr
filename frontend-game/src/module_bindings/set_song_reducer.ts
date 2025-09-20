/* eslint-disable */
// Copied set_song_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type SetSong = { code: string; song_id: string };
export namespace SetSong {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('code', AlgebraicType.createStringType()),
      new ProductTypeElement('song_id', AlgebraicType.createStringType()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: SetSong): void { SetSong.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): SetSong { return SetSong.getTypeScriptAlgebraicType().deserialize(reader); }
}
