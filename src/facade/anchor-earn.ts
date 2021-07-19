import {
  AnchorEarnOperations,
  DepositOption,
  QueryOption,
  SendOption,
  WithdrawOption,
} from './types';
import {
  MarketOutput,
  OperationError,
  BalanceOutput,
  TerraAnchorEarn,
  EtherAnchorEarn,
  CHAINS,
  NETWORKS,
  Output,
  TerraUnsignedTxType,
  TerraSignedTxType,
  EtherUnsignedTxType,
  EtherSignedTxType,
} from '../facade';

export interface AnchorEarnOption<T extends CHAINS> {
  chain: T;
  network: NETWORKS;
  endpoint: string;
  privateKey?: Buffer | any;
  mnemonic?: string | any;
  address?: string;
}

namespace TxType {
  export type Unsigned<T> = T extends CHAINS.TERRA
    ? TerraUnsignedTxType
    : T extends CHAINS.ETHER
    ? EtherUnsignedTxType
    : never;

  export type Signed<T> = T extends CHAINS.TERRA
    ? TerraSignedTxType
    : T extends CHAINS.ETHER
    ? EtherSignedTxType
    : never;
}

/**
 * @param {CHAINS} The blockchain that user wants to execute his message in.
 * @param {NETWORKS} the chain networks: It Could be either NETWORKS.TEQUILA_0004 and NETWORKS.COLUMBUS_4.
 * The default network is NETWORKS.COLUMBUS_4.
 * @param {privateKey} chain account private key.
 * @param {mnemonic} list of words that is used to retrieve private key.
 * @param {address}: Client’s Terra address. It can be only used for queries.
 *
 * @example
 * const anchorEarn = new AnchorEarn({
      network: NETWORKS.TEQUILA0004,
      private_key: '....',
    });
 */
export class AnchorEarn<T extends CHAINS>
  implements AnchorEarnOperations<TxType.Unsigned<T>, TxType.Signed<T>> {
  private earn: AnchorEarnOperations<TxType.Unsigned<T>, TxType.Signed<T>>;

  constructor(options: AnchorEarnOption<T>) {
    switch (options.chain) {
      case CHAINS.TERRA: {
        this.earn = new TerraAnchorEarn({
          network: options.network,
          privateKey: options.privateKey as Buffer,
          mnemonic: options.mnemonic as string,
          address: options.address,
        }) as AnchorEarnOperations<TxType.Unsigned<T>, TxType.Signed<T>>;
        break;
      }
      case CHAINS.ETHER: {
        this.earn = new EtherAnchorEarn({
          network: options.network,
          endpoint: options.endpoint,
          privateKey: options.privateKey as Buffer,
        }) as AnchorEarnOperations<TxType.Unsigned<T>, TxType.Signed<T>>;
        break;
      }
      default:
        throw new Error(`invalid chain option ${options.chain}`);
    }
  }

  async balance(options: QueryOption): Promise<BalanceOutput> {
    return this.earn.balance(options);
  }

  deposit(
    depositOption: DepositOption<TxType.Unsigned<T>, TxType.Signed<T>>,
  ): Promise<Output | OperationError> {
    return this.earn.deposit(depositOption);
  }

  withdraw(
    withdrawOption: WithdrawOption<TxType.Unsigned<T>, TxType.Signed<T>>,
  ): Promise<Output | OperationError> {
    return this.earn.withdraw(withdrawOption);
  }

  send(
    options: SendOption<TxType.Unsigned<T>, TxType.Signed<T>>,
  ): Promise<Output | OperationError> {
    return this.earn.send(options);
  }

  market(options: QueryOption): Promise<MarketOutput> {
    return this.earn.market(options);
  }
}
