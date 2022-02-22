import { LCDClient } from '@terra-money/terra.js';
import { AddressProvider, DENOMS } from '../address-provider';
import { Balance } from './types';
interface Option {
    lcd: LCDClient;
    address: string;
    market: DENOMS;
}
/**
 * @param lcd to connect to terra chain
 * @param address Client’s Terra address.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 */
export declare const queryAUSTBalance: ({ lcd, address, market }: Option) => (addressProvider: AddressProvider) => Promise<Balance>;
export {};
