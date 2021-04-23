import * as yaml from 'yaml';

export interface BalanceEntry {
  currency: string;
  account_balance: string;
  deposit_balance: string;
}
export class BalanceOutput {
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
    this.network = network;
    this.height = height;
    this.address = address;
    this.balances = balances;
    this.timestamp = new Date();
    this.total_account_balance_in_ust = total_account_balance_in_ust;
    this.total_deposit_balance_in_ust = total_deposit_balance_in_ust;
  }

  print(): void {
    console.log(yaml.stringify(this));
  }
}
