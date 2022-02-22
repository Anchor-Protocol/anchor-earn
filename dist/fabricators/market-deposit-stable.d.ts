import { MsgExecuteContract } from '@terra-money/terra.js';
import { AddressProvider } from '../address-provider';
import { DENOMS } from '../address-provider';
interface Option {
    address: string;
    currency: DENOMS;
    amount: string;
}
/**
 *
 * @param address Client’s Terra address.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 * @param amount Amount of a stablecoin to deposit.
 */
export declare const fabricateMarketDepositStableCoin: ({ address, currency, amount, }: Option) => (addressProvider: AddressProvider) => MsgExecuteContract[];
export {};
