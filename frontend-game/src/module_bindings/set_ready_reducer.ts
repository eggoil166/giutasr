/* eslint-disable */
// Copied set_ready_reducer binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type SetReady = { code: string; ready: boolean };
export namespace SetReady {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('code', AlgebraicType.createStringType()),
      new ProductTypeElement('ready', AlgebraicType.createBoolType()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: SetReady): void { SetReady.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): SetReady { return SetReady.getTypeScriptAlgebraicType().deserialize(reader); }
}
