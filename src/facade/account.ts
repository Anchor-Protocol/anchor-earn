import {AccAddress, MnemonicKey, PublicKey, Wallet} from '@terra-money/terra.js';
import { JSONSerializable } from '../utils/json';
import { CHAINS } from './output';

//TODO: use an interface for Account
export class Account extends JSONSerializable<Account.Data> {
  accAddress: AccAddress;
  publicKey: PublicKey;
  privateKey: Buffer;
  mnemonic: string;

  constructor(chain: CHAINS) {
    super();
    switch (chain) {
      case CHAINS.TERRA: {
        const account = new MnemonicKey();
        this.accAddress = account.accAddress;
        this.publicKey = account.publicKey;
        this.privateKey = account.privateKey;
        this.mnemonic = account.mnemonic;
      }
    }
  }

  toData(): Account.Data {
    return {
      acc_address: this.accAddress.toString(),
      public_key: this.publicKey.toString(),
      private_key: this.privateKey,
      mnemonic: this.mnemonic,
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
    private_key: Buffer;
    mnemonic: string;
  }
}

export { Wallet, MnemonicKey };
