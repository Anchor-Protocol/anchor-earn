import { ethers, providers, Wallet } from 'ethers';

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
import ethAddress = Parse.ethAddress;
import assertMarket = Parse.assertMarket;

import { Parse } from '../utils';
import { assertInput } from 'src/utils/assert-inputs';

interface EtherAnchorEarnArgs {
  network: NETWORKS;
  endpoint: string;
  privateKey: Buffer;
}

export type UnsignedTxType = providers.TransactionRequest;
export type SignedTxType = Promise<string>;

export default class EtherAnchorEarn
  implements AnchorEarnOperations<UnsignedTxType, SignedTxType> {
  public readonly network: NETWORKS;
  private readonly provider: ethers.providers.Provider;
  private readonly wallet: Wallet | null = null;

  constructor({ network, endpoint, privateKey }: EtherAnchorEarnArgs) {
    this.network = network;

    this.provider = new ethers.providers.JsonRpcProvider(
      endpoint,
      this.network.toString(),
    );
    if (privateKey) {
      this.wallet = new Wallet(privateKey, this.provider);
    }
  }

  get address(): string | undefined {
    return this.wallet ? this.wallet.address : undefined;
  }

  get blocktime(): Promise<number> {
    return new Promise((resolve, reject) =>
      this.provider
        .getBlock('latest')
        .then(({ timestamp }) => resolve(timestamp))
        .catch(reject),
    );
  }

  async deposit(
    depositOption: DepositOption<UnsignedTxType, SignedTxType>,
  ): Promise<Output | OperationError> {
    const customSigner = depositOption.customSigner;
    const customBroadcaster = depositOption.customBroadcaster;
    const address = this.address;
    const blocktime = await this.blocktime;

    if (!assertMarket()) {
    }

    assertInput<UnsignedTxType, SignedTxType>(customSigner, customBroadcaster);

    throw new Error('Method not implemented.');
  }

  async withdraw(
    withdrawOption: WithdrawOption<UnsignedTxType, SignedTxType>,
  ): Promise<Output | OperationError> {
    throw new Error('Method not implemented.');
  }

  async send(
    sendOption: SendOption<UnsignedTxType, SignedTxType>,
  ): Promise<Output | OperationError> {
    throw new Error('Method not implemented.');
  }

  async balance(options: QueryOption): Promise<BalanceOutput> {
    throw new Error('Method not implemented.');
  }

  async market(options: QueryOption): Promise<MarketOutput> {
    throw new Error('Method not implemented.');
  }
}
