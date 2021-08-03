import { OperationError } from './tx-output';
import { BalanceOutput } from './user-query-output';
import { MarketOutput } from './market-query-output';
import { Loggable } from './loggable';
import { CustomSigner } from './custom-signer';
import { CustomBroadcaster } from './custom-broadcaster';
import { Output } from './output';

export interface DepositOption<Denoms, UnsignedTx, SignedTx>
  extends CustomSigner<UnsignedTx, SignedTx>,
    CustomBroadcaster<UnsignedTx, string>,
    Loggable<Output | OperationError> {
  currency: Denoms;
  amount: string;
}

export interface WithdrawOption<Denoms, UnsignedTx, SignedTx>
  extends CustomSigner<UnsignedTx, SignedTx>,
    CustomBroadcaster<UnsignedTx, string>,
    Loggable<Output | OperationError> {
  currency: Denoms;
  amount: string;
}

export interface SendOption<Denoms, UnsignedTx, SignedTx>
  extends CustomSigner<UnsignedTx, SignedTx>,
    CustomBroadcaster<UnsignedTx, string>,
    Loggable<Output | OperationError> {
  currency: Denoms;
  recipient: string;
  amount: string;
}

export interface QueryOption<Denoms> {
  currencies: Denoms[];
}

export interface AnchorEarnOperations<Denoms, UnsignedTx, SignedTx> {
  deposit(
    depositOption: DepositOption<Denoms, UnsignedTx, SignedTx>,
  ): Promise<Output | OperationError>;
  withdraw(
    withdrawOption: WithdrawOption<Denoms, UnsignedTx, SignedTx>,
  ): Promise<Output | OperationError>;
  send(
    options: SendOption<Denoms, UnsignedTx, SignedTx>,
  ): Promise<Output | OperationError>;
  balance(options: QueryOption<Denoms>): Promise<BalanceOutput>;
  market(options: QueryOption<Denoms>): Promise<MarketOutput>;
}

export enum OperationType {
  SEND = 'send',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  SENDAUST = 'send-aust',
}
