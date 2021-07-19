import { OperationError } from './tx-output';
import { BalanceOutput } from './user-query-output';
import { MarketOutput } from './market-query-output';
import { DENOMS } from '../address-provider';
import { Loggable } from './loggable';
import { CustomSigner } from './custom-signer';
import { Msg, MsgSend, StdTx } from '@terra-money/terra.js';
import { CustomBroadcaster } from './custom-broadcaster';
import { Output } from './output';

export interface DepositOption<UnsignedTx, SignedTx>
  extends CustomSigner<UnsignedTx, SignedTx>,
    CustomBroadcaster<UnsignedTx, string>,
    Loggable<Output | OperationError> {
  currency: DENOMS;
  amount: string;
}

export interface WithdrawOption<UnsignedTx, SignedTx>
  extends CustomSigner<UnsignedTx, SignedTx>,
    CustomBroadcaster<UnsignedTx, string>,
    Loggable<Output | OperationError> {
  currency: DENOMS;
  amount: string;
}

export interface SendOption<UnsignedTx, SignedTx>
  extends CustomSigner<UnsignedTx, SignedTx>,
    CustomBroadcaster<UnsignedTx, string>,
    Loggable<Output | OperationError> {
  currency: DENOMS;
  recipient: string;
  amount: string;
}

export interface QueryOption {
  currencies: DENOMS[];
}

export interface AnchorEarnOperations<UnsignedTx, SignedTx> {
  deposit(
    depositOption: DepositOption<UnsignedTx, SignedTx>,
  ): Promise<Output | OperationError>;
  withdraw(
    withdrawOption: WithdrawOption<UnsignedTx, SignedTx>,
  ): Promise<Output | OperationError>;
  send(
    options: SendOption<UnsignedTx, SignedTx>,
  ): Promise<Output | OperationError>;
  balance(options: QueryOption): Promise<BalanceOutput>;
  market(options: QueryOption): Promise<MarketOutput>;
}

export enum OperationType {
  SEND = 'send',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  SENDAUST = 'send-aust',
}
