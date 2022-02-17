/// <reference types="node" />
import { AnchorEarnOperations, DepositOption, QueryOption, SendOption, WithdrawOption } from './types';
import { MarketOutput, OperationError, BalanceOutput, CHAINS, NETWORKS, Output } from '../facade';
export interface AnchorEarnOption {
    chain: CHAINS;
    network: NETWORKS;
    privateKey?: Buffer | any;
    mnemonic?: string | any;
    address?: string;
}
/**
 * @param {CHAINS} The blockchain that user wants to execute his message in.
 * @param {NETWORKS} the chain networks: It Could be either NETWORKS.BOMBAY_12 and NETWORKS.COLUMBUS_5.
 * The default network is NETWORKS.COLUMBUS_5.
 * @param {privateKey} chain account private key.
 * @param {mnemonic} list of words that is used to retrieve private key.
 * @param {address}: Client’s Terra address. It can be only used for queries.
 *
 * @example
 * const anchorEarn = new AnchorEarn({
      network: NETWORKS.BOMBAY_12,
      private_key: '....',
    });
 */
export declare class AnchorEarn implements AnchorEarnOperations {
    private earn;
    constructor(options: AnchorEarnOption);
    balance(options: QueryOption): Promise<BalanceOutput>;
    deposit(depositOption: DepositOption): Promise<Output | OperationError>;
    market(options: QueryOption): Promise<MarketOutput>;
    send(options: SendOption): Promise<Output | OperationError>;
    withdraw(withdrawOption: WithdrawOption): Promise<Output | OperationError>;
}
