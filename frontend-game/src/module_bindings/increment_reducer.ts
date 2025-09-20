/* eslint-disable */
// Copied increment_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type Increment = { code: string };
export namespace Increment {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('code', AlgebraicType.createStringType()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: Increment): void { Increment.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): Increment { return Increment.getTypeScriptAlgebraicType().deserialize(reader); }
}
