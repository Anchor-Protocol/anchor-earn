import { AccAddress, MnemonicKey } from '@terra-money/terra.js';
import { Parse } from '../utils/parse-input';
import generateTerraAccessToken = Parse.generateTerraAccessToken;
import getAccessToken = Parse.getAccessToken;

export class Account {
  accAddress: AccAddress;
  publicKey: string;
  accessToken: string;
  MnemonicKey: string;

  constructor() {
    const account = new MnemonicKey();
    this.accAddress = account.accAddress;
    this.publicKey = account.accPubKey;
    this.accessToken = generateTerraAccessToken(account.privateKey);
    this.MnemonicKey = account.mnemonic;
  }

  get_private_key(): Buffer {
    return Buffer.from(getAccessToken(this.accessToken), 'base64');
  }
}
