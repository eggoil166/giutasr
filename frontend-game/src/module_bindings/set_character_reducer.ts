/* eslint-disable */
// Copied set_character_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type SetCharacter = { code: string; character: string };
export namespace SetCharacter {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('code', AlgebraicType.createStringType()),
      new ProductTypeElement('character', AlgebraicType.createStringType()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: SetCharacter): void { SetCharacter.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): SetCharacter { return SetCharacter.getTypeScriptAlgebraicType().deserialize(reader); }
}
