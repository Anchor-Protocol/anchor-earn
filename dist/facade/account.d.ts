/// <reference types="node" />
import { AccAddress, MnemonicKey, PublicKey, Wallet } from '@terra-money/terra.js';
import { JSONSerializable } from '../utils/json';
import { CHAINS } from './output';
export declare class Account extends JSONSerializable<Account.Data> {
    accAddress: AccAddress;
    publicKey: PublicKey;
    privateKey: Buffer;
    mnemonic: string;
    constructor(chain: CHAINS);
    toData(): Account.Data;
    get_private_key(): Buffer;
}
export declare namespace Account {
    interface Data {
        acc_address: AccAddress;
        public_key: string;
        private_key: Buffer;
        mnemonic: string;
    }
}
export { Wallet, MnemonicKey };
