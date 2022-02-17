import {
  Coin,
  Dec,
  Int,
  isTxError,
  LCDClient,
  MnemonicKey,
  Msg,
  RawKey,
  Tx,
  TxInfo,
  Wallet,
} from '@terra-money/terra.js';
import {
  createAndSignMsg,
  createNativeSend,
  OperationImpl,
  sendSignedTransaction,
} from './operation';
import {
  Balance,
  fabricateCw20Transfer,
  fabricateMarketDepositStableCoin,
  fabricateMarketRedeemStable,
  queryAUSTBalance,
  queryMarketEpochState,
  queryOverseerEpochState,
} from '../fabricators';
import mainnetDefaultConfig from '../data/anchorearn-default-mainnet';
import testnetDefaultConfig from '../data/anchorearn-default-testnet';
import { Parse } from '../utils';
import {
  AddressProvider,
  AddressProviderFromJson,
  DENOMS,
} from '../address-provider';
import { getTxType, OperationError, TxOutput } from './tx-output';
import { Coins, Numeric } from '@terra-money/terra.js/dist/core';
import { BalanceEntry, BalanceOutput } from './user-query-output';
import { MarketEntry } from './market-query-output';
import {
  AnchorEarnOperations,
  DepositOption,
  OperationType,
  QueryOption,
  SendOption,
  WithdrawOption,
} from './types';
import { CHAINS, NETWORKS, Output, STATUS, TxType } from './output';
import { MarketOutput } from '../facade';
import { assertInput } from '../utils/assert-inputs';
import { tee } from '../utils/tee';
import { getTerraError } from '../utils/sdk-errors';
import accAddress = Parse.accAddress;
import assertMarket = Parse.assertMarket;
import mapCurrencyToUST = Parse.mapCurrencyToUST;
import mapCurrencyToUSD = Parse.mapCurrencyToUSD;
import getNaturalDecimals = Parse.getNaturalDecimals;
import getMicroAmount = Parse.getMicroAmount;

const BLOCKS_IN_YEAR = 4_656_810;

export interface GetAUstBalanceOption {
  market: DENOMS;
  address: string;
}

interface GetUstBalanceOption {
  address: string;
  currency: DENOMS;
}

interface GetExchangeRateOption {
  market: DENOMS;
}

interface GetDepositRateOption {
  market: DENOMS;
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

const defaultGasConfigMap = {
  [NETWORKS.COLUMBUS_5]: {
    gasPrices: mainnetDefaultConfig.lcd.gasPrices,
    gasAdjustment: mainnetDefaultConfig.lcd.gasAdjustment,
  },
  [NETWORKS.BOMBAY_12]: {
    gasPrices: testnetDefaultConfig.lcd.gasPrices,
    gasAdjustment: testnetDefaultConfig.lcd.gasAdjustment,
  },
};

const defaultAddressProvider = {
  [NETWORKS.COLUMBUS_5]: new AddressProviderFromJson(
    mainnetDefaultConfig.contracts,
  ),
  [NETWORKS.BOMBAY_12]: new AddressProviderFromJson(
    testnetDefaultConfig.contracts,
  ),
};

const defaultLCDConfig = {
  [NETWORKS.COLUMBUS_5]: mainnetDefaultConfig.lcd,
  [NETWORKS.BOMBAY_12]: testnetDefaultConfig.lcd,
};

export class TerraAnchorEarn implements AnchorEarnOperations {
  private _lcd: LCDClient;
  private _addressProvider: AddressProvider;
  private _account: Wallet;
  private _gasConfig: GasConfig;
  private _address: string;

  constructor(options: AnchorEarnOptions) {
    const address = options.address;
    const gasConfig = defaultGasConfigMap[options.network] || {
      gasPrices: mainnetDefaultConfig.lcd.gasPrices,
      gasAdjustment: mainnetDefaultConfig.lcd.gasAdjustment,
    };
    const addressProvider =
      defaultAddressProvider[options.network] ||
      new AddressProviderFromJson(mainnetDefaultConfig.contracts);

    const lcd = new LCDClient(defaultLCDConfig[options.network]);

    const account = options.mnemonic
      ? lcd.wallet(new MnemonicKey({ mnemonic: options.mnemonic }))
      : null;

    const privateKey = options.privateKey
      ? lcd.wallet(new RawKey(options.privateKey))
      : null;

    // assign all options
    Object.assign(this, {
      _address: address,
      _gasConfig: gasConfig,
      _addressProvider: addressProvider,
      _lcd: lcd,
      _account: account || privateKey,
    });

    if (!this._address && !this._account) {
      throw new Error('Address or key must be provided');
    }
  }

  getAccount(): Wallet {
    return this._account;
  }

  getLcd(): LCDClient {
    return this._lcd;
  }

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
  async deposit(
    depositOption: DepositOption,
  ): Promise<TxOutput | OperationError> {
    const customSigner = depositOption.customSigner;
    const customBroadcaster = depositOption.customBroadcaster;
    const address = this.getAddress();

    if (!assertMarket(depositOption.currency)) {
      throw new Error('Invalid Market');
    }

    assertInput<Msg[], Tx>(customSigner, customBroadcaster);

    await this.assertUSTBalance(
      depositOption.currency,
      depositOption.amount,
      address,
    );

    const operation = new OperationImpl(
      fabricateMarketDepositStableCoin,
      depositOption,
      this._addressProvider,
    );

    return this.operationHelper(
      depositOption,
      OperationType.DEPOSIT,
      operation.generateWithAddress(address),
    );
  }

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
  async withdraw(
    withdrawOption: WithdrawOption,
  ): Promise<TxOutput | OperationError> {
    const customSigner = withdrawOption.customSigner;
    const customBroadcaster = withdrawOption.customBroadcaster;

    const address = this.getAddress();

    if (withdrawOption.amount == '0') {
      throw new Error('Invalid zero amount');
    }

    assertInput<Msg[], Tx>(customSigner, customBroadcaster);


    let requestedAmount = '0';

    switch (withdrawOption.currency) {
      case DENOMS.AUST: {
        withdrawOption.currency = DENOMS.UST;
        const exchangeRate = await this.getExchangeRate({
          market: DENOMS.UST,
        });
        requestedAmount = getNaturalDecimals(
          getMicroAmount(withdrawOption.amount).mul(exchangeRate).toString(),
        );
        break;
      }
      case DENOMS.UST: {
        const exchangeRate = await this.getExchangeRate({
          market: DENOMS.UST,
        });
        requestedAmount = withdrawOption.amount;

        withdrawOption.amount = getNaturalDecimals(
          getMicroAmount(withdrawOption.amount).div(exchangeRate).toString(),
        );
      }
    }
    
    await this.assertAUSTBalance(
      withdrawOption.amount,
      address ? address : undefined,
    );

    const operation = new OperationImpl(
      fabricateMarketRedeemStable,
      withdrawOption,
      this._addressProvider,
    );

    return this.operationHelper(
      withdrawOption,
      OperationType.WITHDRAW,
      operation.generateWithAddress(address),
      requestedAmount,
    );
  }

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

  async send(options: SendOption): Promise<TxOutput | OperationError> {
    const customSigner = options.customSigner;
    const customBroadcaster = options.customBroadcaster;
    const address = this.getAddress();

    assertInput<Msg[], Tx>(customSigner, customBroadcaster);

    switch (options.currency) {
      case DENOMS.UST: {
        const coin = new Coin('uusd', getMicroAmount(options.amount));
        await this.assertUSTBalance(
          DENOMS.UST,
          options.amount,
          accAddress(address),
        );
        const msg = createNativeSend(address, {
          recipient: options.recipient,
          coin: coin,
        });
        return this.operationHelper(options, OperationType.SEND, [msg]);
      }
      case DENOMS.AUST: {
        options.currency = DENOMS.UST;
        await this.assertAUSTBalance(
          options.amount,
          address ? accAddress(address) : undefined,
        );
        const operation = new OperationImpl(
          fabricateCw20Transfer,
          options,
          this._addressProvider,
        );
        return this.operationHelper(
          options,
          OperationType.SENDAUST,
          operation.generateWithAddress(address),
        );
      }
    }
  }

  // /**
  //  * @param {currencies} options.currencies is a list of currency currencies.
  //  *
  //  * @example
  //  * const userBalance = await anchorEarn.balance({
  //     currencies: [DENOMS.UST, DENOMS.KRW],
  //   });
  //  */
  //
  async balance(options: QueryOption): Promise<BalanceOutput> {
    const address = this.getAddress();
    const balances = await Promise.all(
      options.currencies.map(async (currency) => {
        return await this.getCurrencyState(currency, accAddress(address));
      }),
    );

    const height = await Promise.all([this.getHeight()]);

    const totalBalance = await Promise.all([this.getTotalBalance(balances)]);

    const totalDeposit = await Promise.all([this.getTotalDeposit(balances)]);

    return new BalanceOutput(
      CHAINS.TERRA,
      this._lcd.config.chainID,
      height[0],
      address,
      balances,
      getNaturalDecimals(totalBalance[0]),
      getNaturalDecimals(totalDeposit[0]),
    );
  }

  /**
   * @param {currencies} options.currencies is a list of market currencies.
   *
   * @example
   * const userBalance = await anchorEarn.currency({
      currencies: [DENOMS.UST, DENOMS.KRW],
    });
   */

  async market(options: QueryOption): Promise<MarketOutput> {
    const markets = await Promise.all(
      options.currencies
        .filter((currency) => assertMarket(currency))
        .map(async (currency) => {
          return await this.getCurrencyMarketState(currency);
        }),
    );

    const height = await Promise.all([await this.getHeight()]);

    return new MarketOutput(
      CHAINS.TERRA,
      this._lcd.config.chainID,
      height[0],
      markets,
    );
  }

  private async getAUstBalance(
    getAUstBalanceOption: GetAUstBalanceOption,
  ): Promise<Balance> {
    return await queryAUSTBalance({
      lcd: this._lcd,
      address: accAddress(getAUstBalanceOption.address),
      market: getAUstBalanceOption.market,
    })(this._addressProvider);
  }

  private async getNativeBalance(
    getNativeBalanceOption: GetUstBalanceOption,
  ): Promise<Coin> {
    const userCoins = await this._lcd.bank.balance(
      accAddress(getNativeBalanceOption.address),
    );

    const coins:Coins = userCoins[0];
    return coins.get(getNativeBalanceOption.currency);
  }

  private async getExchangeRate(
    getExchangeRateOption: GetExchangeRateOption,
  ): Promise<string> {
    const blockHeight = await this.getHeight();
    const state = await queryMarketEpochState({
      lcd: this._lcd,
      market: getExchangeRateOption.market,
      block_height: blockHeight,
    })(this._addressProvider);
    return state.exchange_rate;
  }

  private async getDepositRate(
    getDepositRateOption: GetDepositRateOption,
  ): Promise<string> {
    const state = await queryOverseerEpochState({
      lcd: this._lcd,
      market: getDepositRateOption.market,
    })(this._addressProvider);
    return state.deposit_rate;
  }

  private getAddress(): string {
    if (this._address === undefined) {
      if (this._account === undefined) {
        return undefined;
      } else {
        return this._account.key.accAddress;
      }
    } else {
      return this._address;
    }
  }

  private async getHeight(): Promise<number> {
    const blockInfo = await this._lcd.tendermint.blockInfo();
    return Parse.int(blockInfo.block.header.height);
  }

  private async getCurrencyState(
    currency: DENOMS,
    address?: string,
  ): Promise<BalanceEntry> {
    let accountBalance;
    let depositBalance;
    if (address) {
      accountBalance = await Promise.all([
        this.getNativeBalance({
          address: address,
          currency,
        }),
      ]);
      depositBalance = await Promise.all([
        this.getAUstBalance({
          address: address,
          market: currency,
        }),
      ]);
    } else {
      accountBalance = await Promise.all([
        this.getNativeBalance({
          address: this.getAddress(),
          currency,
        }),
      ]);
      depositBalance = await Promise.all([
        this.getAUstBalance({
          address: this.getAddress(),
          market: currency,
        }),
      ]);
    }

    const exchangeRate = await this.getExchangeRate({
      market: currency,
    });

    return {
      currency: mapCurrencyToUST(currency),
      account_balance: getNaturalDecimals(accountBalance[0]?.amount.toString()),
      deposit_balance: getNaturalDecimals(
        new Int(
          new Dec(depositBalance[0].balance).mul(exchangeRate).toString(),
        ).toString(),
      ),
    };
  }

  private async getTotalBalance(balances: BalanceEntry[]): Promise<string> {
    let totalBalance = 0;
    for (const entry of balances) {
      if (mapCurrencyToUSD(entry.currency) !== DENOMS.UST) {
        const swapCoin = await this._lcd.market.swapRate(
          new Coin(entry.currency, entry.account_balance),
          DENOMS.UST,
        );
        const inMicro = Parse.getMicroAmount(swapCoin.amount.toString());
        totalBalance += Parse.int(inMicro.toString());
      } else {
        const inMicro = Parse.getMicroAmount(entry.account_balance);
        totalBalance += Parse.int(inMicro.toString());
      }
    }
    return totalBalance.toString();
  }

  private async getTotalDeposit(balances: BalanceEntry[]): Promise<string> {
    let totalBalance = 0;
    for (const entry of balances) {
      if (
        mapCurrencyToUSD(entry.currency) !== DENOMS.UST &&
        Parse.int(entry.deposit_balance) > 0
      ) {
        const swapCoin = await this._lcd.market.swapRate(
          new Coin(entry.currency, entry.deposit_balance),
          DENOMS.UST,
        );
        const inMicro = Parse.getMicroAmount(swapCoin.amount.toString());
        totalBalance += Parse.int(inMicro.toString());
      } else {
        const inMicro = Parse.getMicroAmount(entry.deposit_balance);
        totalBalance += Parse.int(inMicro.toString());
      }
    }
    return totalBalance.toString();
  }

  private async getCurrencyMarketState(currency: DENOMS): Promise<MarketEntry> {
    const contractBalance = await this.getNativeBalance({
      address: this._addressProvider.market(currency),
      currency,
    });

    const depositRate = await Promise.all([
      this.getDepositRate({ market: currency }),
    ]);
    const APY = new Dec(BLOCKS_IN_YEAR).mul(depositRate[0]);

    return {
      currency: mapCurrencyToUST(currency),
      liquidity: getNaturalDecimals(contractBalance.amount.toString()),
      APY: APY.toString(),
    };
  }

  private async assertUSTBalance(
    market: DENOMS,
    requestedAmount: string,
    address?: string,
  ): Promise<void> {
    if (requestedAmount == '0') {
      throw new Error('Invalid zero amount');
    }

    let ustBalance;
    if (address) {
      ustBalance = await this.getNativeBalance({
        address: accAddress(address),
        currency: market,
      });
    } else {
      ustBalance = await this.getNativeBalance({
        address: this._account.key.accAddress,
        currency: market,
      });
    }

    if (ustBalance === undefined) {
      throw new Error('Insufficient ust balance');
    }

    const userRequest = Parse.getMicroAmount(requestedAmount);

    if (userRequest.greaterThan(ustBalance.amount)) {
      throw new Error(
        `Insufficient ust balance ${userRequest.toString()}> ${ustBalance.toString()}. Cannot deposit`,
      );
    }
  }

  private async assertAUSTBalance(
    requestedAmount: string,
    address?: string,
  ): Promise<void> {
    const austBalance = address
      ? await this.getAUstBalance({
          address: accAddress(address),
          market: DENOMS.UST,
        })
      : await this.getAUstBalance({
          address: this._account.key.accAddress,
          market: DENOMS.UST,
        });

    const userRequest = Parse.getMicroAmount(requestedAmount);

    if (austBalance.balance === '0' || austBalance.balance === undefined) {
      throw new Error(`There is no deposit for the user`);
    }
    if (userRequest.greaterThan(austBalance.balance)) {
      throw new Error(
        `Cannot withdraw more than balance. ${userRequest.toString()} > ${
          austBalance.balance
        }`,
      );
    }
  }

  private async getTax(requestAmount: string): Promise<string> {
    //get the taxCap
    const taxCap = await this._lcd.treasury.taxCap(DENOMS.UST);

    //get the height for taxRate
    const height = await Promise.all([this.getHeight()]);

    // get the current taxRate
    const taxRate = await this._lcd.treasury.taxRate(height[0]);

    // Tax = min(transfer_amount * tax_rate, tax_cap)
    return Dec.min(
      taxRate.mul(requestAmount),
      taxCap.amount.toString(),
    ).toString();
  }

  private generateOutput(
    tx: TxInfo,
    type: OperationType,
    taxFee: string,
    loggable?: (data: OperationError | TxOutput) => Promise<void> | void,
    requestedAmount?: string,
  ): TxOutput | OperationError {
    const result = new TxOutput(
      tx,
      type,
      CHAINS.TERRA,
      this._lcd.config.chainID,
      taxFee,
      +new Coins(this._gasConfig.gasPrices).get('uusd').amount,
      requestedAmount,
    );
    if (loggable) {
      loggable(result);
    }
    return result;
  }

  private async operationHelper(
    options: DepositOption | WithdrawOption | SendOption,
    txType: OperationType,
    msg: Msg[],
    requestedAmount?: string,
  ): Promise<TxOutput | OperationError> {
    const customSigner = options.customSigner;
    const loggable = options.log || (() => void 0);
    const customBroadcaster = options.customBroadcaster;
    const taxFee = await Promise.all([this.getTax(options.amount)]);

    const signAndBroadcast = async (unsignedTx: Msg[]): Promise<string> => {
      // if customBroadcaster is provided,
      // that's it!
      if (customBroadcaster) return customBroadcaster(unsignedTx);

      // control flow
      const createTx =
        customSigner ||
        ((msg?: Msg[]) => {
          return createAndSignMsg(
            this.getAccount(),
            {
              gasPrices: this._gasConfig.gasPrices,
              gasAdjustment: this._gasConfig.gasAdjustment,
            },
            msg,
          );
        });

      return Promise.resolve()
        .then(() => {
          return createTx(unsignedTx)
        })
        .then(
          tee((_signedTx) => {
            loggable({
              type: getTxType(txType),
              status: STATUS.IN_PROGRESS,
              currency: mapCurrencyToUST(options.currency),
              amount: options.amount,
              //txFee: mapCoinToUST(signedTx.fee.amount),
              deductedTax: '0',
            } as Output);
          }),
        )
        .then((signedTx) => {
          return sendSignedTransaction(this._lcd, signedTx)
        })
        .then((result) => {if (isTxError(result)) {
          if ( typeof result.code === 'number' ) {
              return Promise.reject( new Error(getTerraError(result.raw_log, result.code)))
          } else {
              return Promise.reject(
                  new Error(getTerraError(result.raw_log,parseInt( result.code,10))))
          }
    } else {
             return result.txhash}
    });
    };

    return Promise.resolve()
      .then(() => {
        return msg;
      })
      .then((tx) => signAndBroadcast(tx))
      .then((txhash) => {
        return this.getOutputFromHash(
          txType,
          taxFee[0],
          txhash,
          loggable,
          requestedAmount,
        );
      })
      .catch((e: Error) => {
        const error = {
          type: TxType.SEND,
          chain: CHAINS.TERRA,
          network: this._lcd.config.chainID,
          error_msg: e.message,
          status: STATUS.UNSUCCESSFUL,
        } as OperationError;
        loggable(error);
        throw new Error(e.message);
      });
  }

  private async getOutputFromHash(
    type: OperationType,
    taxFee: string,
    txHash?: string,
    loggable?: (data: OperationError | TxOutput) => Promise<void> | void,
    requestedAmount?: string,
  ): Promise<TxOutput | OperationError> {
    const txInfo = await this.getTxInfo(txHash);
    return this.generateOutput(txInfo, type, taxFee, loggable, requestedAmount);
  }

  private async getTxInfo(txHash: string): Promise<TxInfo> {
    return await new Promise((resolve) => {
      const interval = setInterval(() => {
        this._lcd.tx
          .txInfo(txHash)
          .then((result) => {
            clearInterval(interval);
            resolve(result);
          })
          .catch(() => {});
      }, 1000);
    });
  }
}
