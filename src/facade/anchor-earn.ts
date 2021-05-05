import { AnchorEarnOperations, CHAINS, NETWORKS } from './types';
import { TerraAnchorEarn } from './terra-anchor-earn';

export interface AnchorEarnOption {
  chain: CHAINS;
  network: NETWORKS;
  accessToken?: string;
  address?: string;
}

/**
 * @param {CHAINS} The blockchain that user wants to execute his message in.
 * @param {NETWORKS} the chain networks: It Could be either NETWORKS.TESTNET and NETWORKS.MAINNET.
 * The default network is NETWORKS.MAINNET.
 * @param {accessToken} Decoded version of the user's private key.
 * @param {address}: Client’s Terra address. It can be only used for queries.
 *
 * @example
 * const anchorEarn = new AnchorEarn({
      network: NETWORKS.TEQUILA0004,
      accessToken: '....',
    });
 */

export class AnchorEarn {
  earn: AnchorEarnOperations;

  constructor(options: AnchorEarnOption) {
    switch (options.chain) {
      case CHAINS.TERRA: {
        this.earn = new TerraAnchorEarn({
          network: options.network,
          accessToken: options.accessToken,
          address: options.address,
        });
      }
    }
  }
}
