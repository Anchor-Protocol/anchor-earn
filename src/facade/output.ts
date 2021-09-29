/// TxType are send, withdraw and deposit.
/// SENDAUST usage is only for processing logs.
export enum TxType {
  SEND = 'send',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

export interface TxDetails {
  chain: string;
  network: string;
  height: number;
  timestamp: Date;
  txHash: string;
}

export interface Output {
  chain: string;
  network: string;
  status: STATUS;
  type: TxType;
  currency: string;
  amount: string;
  txDetails: TxDetails[];
  txFee: string;
  deductedTax?: string;
}

export enum STATUS {
  SUCCESSFUL = 'successful',
  UNSUCCESSFUL = 'unsuccessful',
  IN_PROGRESS = 'in-progress',
}

export enum CHAINS {
  TERRA = 'terra',
}

export enum NETWORKS {
  COLUMBUS_5,
  BOMBAY_12,
}
