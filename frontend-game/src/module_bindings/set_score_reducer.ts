/* eslint-disable */
// Copied set_score_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type SetScore = { code: string; score: number };
export namespace SetScore {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('code', AlgebraicType.createStringType()),
      new ProductTypeElement('score', AlgebraicType.createU32Type()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: SetScore): void { SetScore.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): SetScore { return SetScore.getTypeScriptAlgebraicType().deserialize(reader); }
}
