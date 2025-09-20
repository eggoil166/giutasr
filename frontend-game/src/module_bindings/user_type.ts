/* eslint-disable */
// Copied user_type binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, Identity, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';
export type User = { identity: Identity; name: string | undefined; online: boolean };
export namespace User {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('identity', AlgebraicType.createIdentityType()),
      new ProductTypeElement('name', AlgebraicType.createOptionType(AlgebraicType.createStringType())),
      new ProductTypeElement('online', AlgebraicType.createBoolType()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: User): void { User.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): User { return User.getTypeScriptAlgebraicType().deserialize(reader); }
}
