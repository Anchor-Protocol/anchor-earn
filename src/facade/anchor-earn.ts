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
  CHAINS,
  NETWORKS,
  Output,
} from '../facade';
import EtherAnchorEarn from './ether-anchor-earn';

export interface AnchorEarnOption {
  chain: CHAINS;
  network: NETWORKS;
  endpoint: string;
  privateKey?: Buffer | any;
  mnemonic?: string | any;
  address?: string;
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

export class AnchorEarn implements AnchorEarnOperations {
  private earn: AnchorEarnOperations;

  constructor(options: AnchorEarnOption) {
    switch (options.chain) {
      case CHAINS.TERRA: {
        this.earn = new TerraAnchorEarn({
          network: options.network,
          privateKey: options.privateKey as Buffer,
          mnemonic: options.mnemonic as string,
          address: options.address,
        });
        break;
      }
      case CHAINS.ETHER: {
        this.earn = new EtherAnchorEarn({
          network: options.network,
          endpoint: options.endpoint,
          privateKey: options.privateKey as Buffer,
        });
      }
    }
  }

  async balance(options: QueryOption): Promise<BalanceOutput> {
    return this.earn.balance(options);
  }

  deposit(depositOption: DepositOption): Promise<Output | OperationError> {
    return this.earn.deposit(depositOption);
  }

  market(options: QueryOption): Promise<MarketOutput> {
    return this.earn.market(options);
  }

  send(options: SendOption): Promise<Output | OperationError> {
    return this.earn.send(options);
  }

  withdraw(withdrawOption: WithdrawOption): Promise<Output | OperationError> {
    return this.earn.withdraw(withdrawOption);
  }
}
