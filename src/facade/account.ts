import { AccAddress, MnemonicKey } from '@terra-money/terra.js';
import { Parse } from '../utils/parse-input';
import generateTerraAccessToken = Parse.generateTerraAccessToken;
import getAccessToken = Parse.getAccessToken;
import { JSONSerializable } from '../utils/json';

export class Account extends JSONSerializable<Account.Data> {
  accAddress: AccAddress;
  publicKey: string;
  accessToken: string;
  MnemonicKey: string;

  constructor() {
    super();
    const account = new MnemonicKey();
    this.accAddress = account.accAddress;
    this.publicKey = account.accPubKey;
    this.accessToken = generateTerraAccessToken(account.privateKey);
    this.MnemonicKey = account.mnemonic;
  }

  toData(): Account.Data {
    return {
      accAddress: this.accAddress.toString(),
      publicKey: this.publicKey,
      accessToken: this.accessToken,
      MnemonicKey: this.MnemonicKey,
    };
  }

  get_private_key(): Buffer {
    return Buffer.from(getAccessToken(this.accessToken), 'base64');
  }
}

export namespace Account {
  export interface Data {
    accAddress: AccAddress;
    publicKey: string;
    accessToken: string;
    MnemonicKey: string;
  }
}
