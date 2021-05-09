import { OperationError } from './output-impl';
import { BalanceOutput } from './user-query-output';
import { MarketOutput } from './market-query-output';
import { DENOMS } from '../address-provider';
import { Loggable } from './loggable';
import { CustomSigner } from './custom-signer';
import {
  Msg,
  MsgSend,
  StdTx,
  SyncTxBroadcastResult,
} from '@terra-money/terra.js';
import { CustomBroadcaster } from './custom-broadcaster';

export interface DepositOption
  extends CustomSigner<Msg[], StdTx>,
    CustomBroadcaster<StdTx, SyncTxBroadcastResult>,
    Loggable<Output | InProgress | OperationError> {
  currency: DENOMS;
  amount: string;
  address?: string;
}

export interface WithdrawOption
  extends CustomSigner<Msg[], StdTx>,
    CustomBroadcaster<StdTx, SyncTxBroadcastResult>,
    Loggable<Output | InProgress | OperationError> {
  currency: DENOMS;
  amount: string;
  address?: string;
}

export interface SendOption
  extends CustomSigner<Msg[] | MsgSend, StdTx>,
    CustomBroadcaster<StdTx, SyncTxBroadcastResult>,
    Loggable<Output | InProgress | OperationError> {
  currency: DENOMS;
  recipient: string;
  amount: string;
  address?: string;
}

export interface QueryOption {
  currencies: DENOMS[];
  address?: string;
}

export interface AnchorEarnOperations {
  deposit(depositOption: DepositOption): Promise<Output | OperationError>;
  withdraw(withdrawOption: WithdrawOption): Promise<Output | OperationError>;
  send(options: SendOption): Promise<Output | OperationError>;
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

export interface TxDetails {
  chain: string;
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
}

export enum CHAINS {
  TERRA = 'terra',
  ETH = 'ethereum',
}

export enum NETWORKS {
  MAINNET,
  TESTNET,
}
