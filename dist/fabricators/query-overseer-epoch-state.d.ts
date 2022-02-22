import { LCDClient } from '@terra-money/terra.js';
import { AddressProvider, DENOMS } from '../address-provider';
interface Option {
    lcd: LCDClient;
    market: DENOMS;
}
interface EpochStateResponse {
    deposit_rate: string;
    prev_aterra_supply: string;
    prev_exchange_rate: string;
    last_executed_height: number;
}
/**
 * @param lcd to connect to terra chain.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 */
export declare const queryOverseerEpochState: ({ lcd, market }: Option) => (addressProvider: AddressProvider) => Promise<EpochStateResponse>;
export {};
