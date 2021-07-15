import { ethers, Wallet } from 'ethers';
import { MarketOutput } from './market-query-output';

import { NETWORKS, Output } from './output';
import { OperationError } from './tx-output';
import {
  AnchorEarnOperations,
  DepositOption,
  QueryOption,
  SendOption,
  WithdrawOption,
} from './types';
import { BalanceOutput } from './user-query-output';

interface EtherAnchorEarnArgs {
  network: NETWORKS;
  endpoint: string;
  privateKey: Buffer;
}

export default class EtherAnchorEarn implements AnchorEarnOperations {
  public readonly network: NETWORKS;
  private readonly wallet: Wallet;

  constructor({ network, endpoint, privateKey }: EtherAnchorEarnArgs) {
    this.network = network;

    const provider = new ethers.providers.JsonRpcProvider(
      endpoint,
      this.network.toString(),
    );
    this.wallet = new Wallet(privateKey, provider);
  }

  get address(): string {
    return this.wallet.address;
  }

  deposit(depositOption: DepositOption): Promise<Output | OperationError> {
    throw new Error('Method not implemented.');
  }

  withdraw(withdrawOption: WithdrawOption): Promise<Output | OperationError> {
    throw new Error('Method not implemented.');
  }

  send(options: SendOption): Promise<Output | OperationError> {
    throw new Error('Method not implemented.');
  }

  balance(options: QueryOption): Promise<BalanceOutput> {
    throw new Error('Method not implemented.');
  }

  market(options: QueryOption): Promise<MarketOutput> {
    throw new Error('Method not implemented.');
  }
}
