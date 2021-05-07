import { AnchorEarnOperations, CHAINS, NETWORKS } from './types';
import { TerraAnchorEarn } from './terra-anchor-earn';

export interface AnchorEarnOption {
  chain: CHAINS;
  network: NETWORKS;
  privateKey?: Buffer | any;
  mnemonicKey?: string | any;
  address?: string;
}

/**
 * @param {CHAINS} The blockchain that user wants to execute his message in.
 * @param {NETWORKS} the chain networks: It Could be either NETWORKS.TESTNET and NETWORKS.MAINNET.
 * The default network is NETWORKS.MAINNET.
 * @param {privateKey} chain account private key.
 * @param {mnemonicKey} list of words that is used to retrieve private key.
 * @param {address}: Client’s Terra address. It can be only used for queries.
 *
 * @example
 * const anchorEarn = new AnchorEarn({
      network: NETWORKS.TEQUILA0004,
      private_key: '....',
    });
 */

export class AnchorEarn {
  earn: AnchorEarnOperations;

  constructor(options: AnchorEarnOption) {
    switch (options.chain) {
      case CHAINS.TERRA: {
        this.earn = new TerraAnchorEarn({
          network: options.network,
          privateKey: options.privateKey as Buffer,
          mnemonicKey: options.mnemonicKey as string,
          address: options.address,
        });
      }
    }
  }
}
