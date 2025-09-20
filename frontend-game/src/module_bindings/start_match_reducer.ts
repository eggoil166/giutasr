/* eslint-disable */
// Copied start_match_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type StartMatch = { code: string };
export namespace StartMatch {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('code', AlgebraicType.createStringType()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: StartMatch): void { StartMatch.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): StartMatch { return StartMatch.getTypeScriptAlgebraicType().deserialize(reader); }
}
