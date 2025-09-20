/* eslint-disable */
// Copied lobby_type binding
// @ts-nocheck
import { AlgebraicType, ProductTypeElement, Identity, Timestamp, BinaryWriter, BinaryReader } from '@clockworklabs/spacetimedb-sdk';

export type Lobby = {
  code: string;
  red: Identity | undefined;
  blue: Identity | undefined;
  red_count: number;
  blue_count: number;
  created: Timestamp;
  red_char: string | undefined;
  blue_char: string | undefined;
  red_ready: boolean;
  blue_ready: boolean;
  song_id: string | undefined;
  started: boolean;
  red_score: number;
  blue_score: number;
};

export namespace Lobby {
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement('code', AlgebraicType.createStringType()),
      new ProductTypeElement('red', AlgebraicType.createOptionType(AlgebraicType.createIdentityType())),
      new ProductTypeElement('blue', AlgebraicType.createOptionType(AlgebraicType.createIdentityType())),
      new ProductTypeElement('red_count', AlgebraicType.createU32Type()),
      new ProductTypeElement('blue_count', AlgebraicType.createU32Type()),
      new ProductTypeElement('created', AlgebraicType.createTimestampType()),
      new ProductTypeElement('red_char', AlgebraicType.createOptionType(AlgebraicType.createStringType())),
      new ProductTypeElement('blue_char', AlgebraicType.createOptionType(AlgebraicType.createStringType())),
      new ProductTypeElement('red_ready', AlgebraicType.createBoolType()),
      new ProductTypeElement('blue_ready', AlgebraicType.createBoolType()),
      new ProductTypeElement('song_id', AlgebraicType.createOptionType(AlgebraicType.createStringType())),
      new ProductTypeElement('started', AlgebraicType.createBoolType()),
      new ProductTypeElement('red_score', AlgebraicType.createU32Type()),
      new ProductTypeElement('blue_score', AlgebraicType.createU32Type()),
    ]);
  }
  export function serialize(writer: BinaryWriter, value: Lobby): void { Lobby.getTypeScriptAlgebraicType().serialize(writer, value); }
  export function deserialize(reader: BinaryReader): Lobby { return Lobby.getTypeScriptAlgebraicType().deserialize(reader); }
}
