import { AccAddress, MnemonicKey, Wallet } from '@terra-money/terra.js';
import { Parse } from '../utils';
import generateTerraAccessToken = Parse.generateTerraAccessToken;
import { JSONSerializable } from '../utils/json';

export class Account extends JSONSerializable<Account.Data> {
  accAddress: AccAddress;
  publicKey: string;
  privateKey: Buffer;
  MnemonicKey: string;

  constructor() {
    super();
    const account = new MnemonicKey();
    this.accAddress = account.accAddress;
    this.publicKey = account.accPubKey;
    this.privateKey = account.privateKey;
    this.MnemonicKey = account.mnemonic;
  }

  toData(): Account.Data {
    return {
      acc_address: this.accAddress.toString(),
      public_key: this.publicKey,
      private_key: generateTerraAccessToken(this.privateKey),
      mnemonic_key: this.MnemonicKey,
    };
  }

  get_private_key(): Buffer {
    return this.privateKey;
  }
}

export namespace Account {
  export interface Data {
    acc_address: AccAddress;
    public_key: string;
    private_key: string;
    mnemonic_key: string;
  }
}

export { Wallet, MnemonicKey };
