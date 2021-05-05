import { JSONSerializable } from '../utils/json';

export interface BalanceEntry {
  currency: string;
  account_balance: string;
  deposit_balance: string;
}
export class BalanceOutput extends JSONSerializable<BalanceOutput.Data> {
  network: string;
  height: number;
  timestamp: Date;
  address: string;
  balances: BalanceEntry[];
  total_account_balance_in_ust: string;
  total_deposit_balance_in_ust: string;

  constructor(
    network: string,
    height: number,
    address: string,
    balances: BalanceEntry[],
    total_account_balance_in_ust: string,
    total_deposit_balance_in_ust: string,
  ) {
    super();
    this.network = network;
    this.height = height;
    this.address = address;
    this.balances = balances;
    this.timestamp = new Date();
    this.total_account_balance_in_ust = total_account_balance_in_ust;
    this.total_deposit_balance_in_ust = total_deposit_balance_in_ust;
  }

  public toData(): BalanceOutput.Data {
    return {
      network: this.network,
      height: this.height,
      timestamp: this.timestamp,
      address: this.address,
      balances: this.balances,
      total_account_balance_in_ust: this.total_account_balance_in_ust,
      total_deposit_balance_in_ust: this.total_deposit_balance_in_ust,
    };
  }
}

export namespace BalanceOutput {
  export interface Data {
    network: string;
    height: number;
    timestamp: Date;
    address: string;
    balances: BalanceEntry[];
    total_account_balance_in_ust: string;
    total_deposit_balance_in_ust: string;
  }
}
