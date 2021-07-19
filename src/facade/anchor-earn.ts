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
  Ether,
  Output,
  TerraSignedTxType,
  TerraUnsignedTxType,
} from '../facade';
import { CHAINS, NETWORKS } from '../types';
import { DENOMS } from '../address-provider';

export interface AnchorEarnOption<T extends CHAINS> {
  chain: T;
  network: NETWORKS;
  endpoint: string;
  privateKey?: Buffer | any;
  mnemonic?: string | any;
  address?: string;
}

export type UnsignedTx<T> = T extends CHAINS.TERRA
  ? TerraUnsignedTxType
  : T extends CHAINS.ETHER
  ? Ether.UnsignedTx
  : never;

export type SignedTx<T> = T extends CHAINS.TERRA
  ? TerraSignedTxType
  : T extends CHAINS.ETHER
  ? Ether.SignedTx
  : never;

export type Denoms<T> = T extends CHAINS.TERRA
  ? DENOMS
  : T extends CHAINS.ETHER
  ? Ether.DENOMS
  : never;

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
  implements AnchorEarnOperations<Denoms<T>, UnsignedTx<T>, SignedTx<T>> {
  private earn: AnchorEarnOperations<Denoms<T>, UnsignedTx<T>, SignedTx<T>>;

  constructor(options: AnchorEarnOption<T>) {
    switch (options.chain) {
      case CHAINS.TERRA: {
        this.earn = new TerraAnchorEarn({
          network: options.network,
          privateKey: options.privateKey as Buffer,
          mnemonic: options.mnemonic as string,
          address: options.address,
        }) as AnchorEarnOperations<Denoms<T>, UnsignedTx<T>, SignedTx<T>>;
        break;
      }
      case CHAINS.ETHER: {
        this.earn = new Ether.AnchorEarn({
          network: options.network,
          endpoint: options.endpoint,
          privateKey: options.privateKey as Buffer,
        }) as AnchorEarnOperations<Denoms<T>, UnsignedTx<T>, SignedTx<T>>;
        break;
      }
      default:
        throw new Error(`invalid chain option ${options.chain}`);
    }
  }

  balance(options: QueryOption<Denoms<T>>): Promise<BalanceOutput> {
    return this.earn.balance(options);
  }

  deposit(
    depositOption: DepositOption<Denoms<T>, UnsignedTx<T>, SignedTx<T>>,
  ): Promise<Output | OperationError> {
    return this.earn.deposit(depositOption);
  }

  withdraw(
    withdrawOption: WithdrawOption<Denoms<T>, UnsignedTx<T>, SignedTx<T>>,
  ): Promise<Output | OperationError> {
    return this.earn.withdraw(withdrawOption);
  }

  send(
    options: SendOption<Denoms<T>, UnsignedTx<T>, SignedTx<T>>,
  ): Promise<Output | OperationError> {
    return this.earn.send(options);
  }

  market(options: QueryOption<Denoms<T>>): Promise<MarketOutput> {
    return this.earn.market(options);
  }
}
