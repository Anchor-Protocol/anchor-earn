/// <reference types="node" />
import { LCDClient, Wallet } from '@terra-money/terra.js';
import { DENOMS } from '../address-provider';
import { OperationError, TxOutput } from './tx-output';
import { Coins, Numeric } from '@terra-money/terra.js/dist/core';
import { BalanceOutput } from './user-query-output';
import { AnchorEarnOperations, DepositOption, QueryOption, SendOption, WithdrawOption } from './types';
import { NETWORKS } from './output';
import { MarketOutput } from '../facade';
export interface GetAUstBalanceOption {
    market: DENOMS;
    address: string;
}
interface GasConfig {
    gasPrices: Coins.Input;
    gasAdjustment: Numeric.Input;
}
/**
 * @param {NETWORKS} Terra networks: It Could be either NETWORKS.BOMBAY_12 and NETWORKS.COLUMBUS_5.
 * The default network is NETWORKS.COLUMBUS_5.
 * @param {privateKey} The user's private key. It will be generated when an account is created.
 * @param {mnemonic} The user's mnemonic key. It will be generated when an account is created.
 * @param {address}: Client’s Terra address. It can be only used for queries.
 *
 * @example
 * const anchorEarn = new AnchorEarn({
      network: NETWORKS.BOMBAY_12,
      private_key: '....',
    });
 */
interface AnchorEarnOptions {
    network?: NETWORKS;
    privateKey?: Buffer;
    mnemonic?: string;
    gasConfig?: GasConfig;
    address?: string;
}
export declare class TerraAnchorEarn implements AnchorEarnOperations {
    private _lcd;
    private _addressProvider;
    private _account;
    private _gasConfig;
    private _address;
    constructor(options: AnchorEarnOptions);
    getAccount(): Wallet;
    getLcd(): LCDClient;
    /**
     * @param {market} depositOption.market Deposit Market. For now, it is only Denom.UST.
     * @param {amount} depositOption.amount for deposit. The amount will be deposited in micro UST. e.g. 1 ust = 1000000 uust
     *
     * @example
     * const deposit = await anchorEarn.deposit({
        amount: '0.01',
        currency: DENOMS.UST,
      });
     */
    deposit(depositOption: DepositOption): Promise<TxOutput | OperationError>;
    /**
     * @param {market} withdrawOption.market Deposit Market.
     * @param {amount} withdrawOption.amount for withdraw. The amount will be withdrawn in micro UST. e.g. 1 ust = 1000000 uust
     *
     * @example
     * const withdraw = await anchorEarn.withdraw({
        amount: '0.01',
        currency: DENOMS.UST,
      });
     */
    withdraw(withdrawOption: WithdrawOption): Promise<TxOutput | OperationError>;
    /**
     * @param {denom} options.currency denomination for send. it could be either DENOMS.UST, DENOMS.AUST
     * @param {amount} options.amount for withdraw. The amount will be withdrawn in micro UST. e.g. 1 ust = 1000000 uust
     * @param {recipient} options.recipient's terra address
     *
     * @example
     * const sendAust = await anchorEarn.send(DENOMS.AUST, {
        recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
        amount: '0.01',
      });
     */
    send(options: SendOption): Promise<TxOutput | OperationError>;
    balance(options: QueryOption): Promise<BalanceOutput>;
    /**
     * @param {currencies} options.currencies is a list of market currencies.
     *
     * @example
     * const userBalance = await anchorEarn.currency({
        currencies: [DENOMS.UST, DENOMS.KRW],
      });
     */
    market(options: QueryOption): Promise<MarketOutput>;
    private getAUstBalance;
    private getNativeBalance;
    private getExchangeRate;
    private getDepositRate;
    private getAddress;
    private getHeight;
    private getCurrencyState;
    private getTotalBalance;
    private getTotalDeposit;
    private getCurrencyMarketState;
    private assertUSTBalance;
    private assertAUSTBalance;
    private getTax;
    private generateOutput;
    private operationHelper;
    private getOutputFromHash;
    private getTxInfo;
}
export {};
