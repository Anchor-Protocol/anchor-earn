import { JSONSerializable } from '../utils/json';
import { CHAINS } from './output';
export interface BalanceEntry {
    currency: string;
    account_balance: string;
    deposit_balance: string;
}
export declare class BalanceOutput extends JSONSerializable<BalanceOutput.Data> {
    chain: CHAINS;
    network: string;
    height: number;
    timestamp: Date;
    address: string;
    balances: BalanceEntry[];
    total_account_balance_in_ust: string;
    total_deposit_balance_in_ust: string;
    constructor(chain: CHAINS, network: string, height: number, address: string, balances: BalanceEntry[], total_account_balance_in_ust: string, total_deposit_balance_in_ust: string);
    toData(): BalanceOutput.Data;
}
export declare namespace BalanceOutput {
    interface Data {
        chain: string;
        network: string;
        height: number;
        timestamp: Date;
        address: string;
        balances: BalanceEntry[];
        total_account_balance_in_ust: string;
        total_deposit_balance_in_ust: string;
    }
}
