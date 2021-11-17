import { OperationError } from './tx-output';
import { BalanceOutput } from './user-query-output';
import { MarketOutput } from './market-query-output';
import { DENOMS } from '../address-provider';
import { Loggable } from './loggable';
import { CustomSigner } from './custom-signer';
import { Msg, MsgSend, Tx } from '@terra-money/terra.js';
import { CustomBroadcaster } from './custom-broadcaster';
import { Output } from './output';

export interface DepositOption
  extends CustomSigner<Msg[], Tx>,
    CustomBroadcaster<Msg[], string>,
    Loggable<Output | OperationError> {
  currency: DENOMS;
  amount: string;
}

export interface WithdrawOption
  extends CustomSigner<Msg[], Tx>,
    CustomBroadcaster<Msg[], string>,
    Loggable<Output | OperationError> {
  currency: DENOMS;
  amount: string;
}

export interface SendOption
  extends CustomSigner<Msg[] | MsgSend, Tx>,
    CustomBroadcaster<Msg[], string>,
    Loggable<Output | OperationError> {
  currency: DENOMS;
  recipient: string;
  amount: string;
}

export interface QueryOption {
  currencies: DENOMS[];
}

export interface AnchorEarnOperations {
  deposit(depositOption: DepositOption): Promise<Output | OperationError>;
  withdraw(withdrawOption: WithdrawOption): Promise<Output | OperationError>;
  send(options: SendOption): Promise<Output | OperationError>;
  balance(options: QueryOption): Promise<BalanceOutput>;
  market(options: QueryOption): Promise<MarketOutput>;
}

export enum OperationType {
  SEND = 'send',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  SENDAUST = 'send-aust',
}
