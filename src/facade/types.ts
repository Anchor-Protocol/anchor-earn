import { OperationError, OutputImpl } from './output-impl';
import { BalanceOutput } from './user-query-output';
import { MarketOutput } from './market-query-output';
import { DENOMS } from '../address-provider';
import { Loggable } from './loggable';
import { CustomSigner } from './custom-signer';
import { Msg, StdTx } from '@terra-money/terra.js';

export interface DepositOption
  extends CustomSigner<Msg[] | unknown, StdTx | unknown>,
    Loggable<OutputImpl | InProgress | OperationError> {
  currency: DENOMS;
  amount: string;
  address?: string;
}

export interface WithdrawOption
  extends CustomSigner<Msg[] | unknown, StdTx | unknown>,
    Loggable<OutputImpl | InProgress | OperationError> {
  currency: DENOMS;
  amount: string;
  address?: string;
}

export interface SendOption
  extends CustomSigner<Msg[] | unknown, StdTx | unknown>,
    Loggable<OutputImpl | InProgress | OperationError> {
  recipient: string;
  amount: string;
  address?: string;
}

export interface QueryOption {
  currencies: DENOMS[];
  address?: string;
}

export interface AnchorEarnOperations<> {
  deposit(depositOption: DepositOption): Promise<OutputImpl | OperationError>;
  withdraw(
    withdrawOption: WithdrawOption,
  ): Promise<OutputImpl | OperationError>;
  send(
    denom: DENOMS,
    options: SendOption,
  ): Promise<OutputImpl | OperationError>;
  balance(options: QueryOption): Promise<BalanceOutput>;
  market(options: QueryOption): Promise<MarketOutput>;
}

export interface InProgress {
  type: 'in-progress';
  chain: CHAINS;
  tx_hash: string;
  timestamp: Date;
}

export enum TxType {
  SEND = 'send',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  SENDAUST = 'sendAUST',
}

export interface Output {
  chain: string;
  network: string;
  status: STATUS;
  txHash: string;
  height: number;
  timestamp: Date;
  type: TxType;
  currency: string;
  amount: string;
  txFee: string;
  deductedTax?: string;
}

export enum STATUS {
  SUCCESSFUL = 'successful',
  UNSUCCESSFUL = 'unsuccessful',
}

export enum CHAINS {
  TERRA = 'terra',
  ETH = 'ethereum',
}

export enum NETWORKS {
  MAINNET,
  TESTNET,
}
