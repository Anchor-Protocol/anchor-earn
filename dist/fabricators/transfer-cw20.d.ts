import { MsgExecuteContract } from '@terra-money/terra.js';
import { AddressProvider, DENOMS } from '../address-provider';
interface Option {
    address: string;
    currency: DENOMS;
    amount: string;
    recipient: string;
}
/**
 * @param address Client’s Terra address.
 * @param contract_address: cw20 token contract address.
 * @param amount Amount of a stablecoin to deposit.
 * @param recipient: Client’s Terra address.
 */
export declare const fabricateCw20Transfer: ({ address, currency, amount, recipient, }: Option) => (addressProvider: AddressProvider) => MsgExecuteContract[];
export {};
