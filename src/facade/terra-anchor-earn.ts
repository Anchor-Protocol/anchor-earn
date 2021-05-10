import {
  Coin,
  Dec,
  Int,
  isTxError,
  LCDClient,
  MnemonicKey,
  Msg,
  RawKey,
  StdTx,
  SyncTxBroadcastResult,
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
import mainNetDefaultConfig from '../data/anchorearn-default-columbus';
import tequilaDefaultConfig from '../data/anchorearn-default-tequila';
import { Parse } from '../utils';
import {
  AddressMap,
  AddressProvider,
  AddressProviderFromJson,
  DENOMS,
} from '../address-provider';
import { OperationError, OutputImpl } from './output-impl';
import { Coins, Numeric } from '@terra-money/terra.js/dist/core';
import { BalanceEntry, BalanceOutput } from './user-query-output';
import { MarketEntry } from './market-query-output';
import {
  AnchorEarnOperations,
  CHAINS,
  DepositOption,
  NETWORKS,
  QueryOption,
  SendOption,
  TxType,
  WithdrawOption,
} from './types';
import { BlockTxBroadcastResult } from '@terra-money/terra.js/dist/client/lcd/api/TxAPI';
import { MarketOutput } from '../facade';
import accAddress = Parse.accAddress;
import assertMarket = Parse.assertMarket;
import mapCurrencyToUST = Parse.mapCurrencyToUST;
import mapCurrencyToUSD = Parse.mapCurrencyToUSD;
import getNaturalDecimals = Parse.getNaturalDecimals;
import getMicroAmount = Parse.getMicroAmount;
import { assertInput } from '../utils/assert-inputs';

const NUMBER_OF_BLOCKS = 4_906_443;
const WITHDRAW_TAX_FEE = '0';

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
 * @param {NETWORKS} Terra networks: It Could be either NETWORKS.TESTNET and NETWORKS.MAINNET.
 * The default network is NETWORKS.MAINNET.
 * @param {accessToken} Decoded version of the user's private key.
 * @param {privateKey} The user's private key. It will be generated when an account is created.
 * @param {MnemonicKey} The user's MnemonicKey key. It will be generated when an account is created.
 * @param {address}: Client’s Terra address. It can be only used for queries.
 *
 * @example
 * const anchorEarn = new AnchorEarn({
      network: NETWORKS.TEQUILA0004,
      private_key: '....',
    });
 */

interface AnchorEarnOptions {
  network?: NETWORKS;
  privateKey?: Buffer;
  mnemonicKey?: string;
  gasConfig?: GasConfig;
  address?: string;
}

export class TerraAnchorEarn implements AnchorEarnOperations {
  private _lcd: LCDClient;
  private _addressProvider: AddressProvider;
  private _account: Wallet;
  private _gasConfig: GasConfig;
  private _address: string;

  constructor(options: AnchorEarnOptions) {
    if (options.address) {
      this._address = options.address;
    }

    if (options.gasConfig) {
      this._gasConfig = {
        gasPrices: options.gasConfig.gasPrices,
        gasAdjustment: options.gasConfig.gasAdjustment,
      };
    }

    if (options.network === undefined) {
      if (options.gasConfig === undefined) {
        this._gasConfig = {
          gasPrices: mainNetDefaultConfig.lcd.gasPrices,
          gasAdjustment: mainNetDefaultConfig.lcd.gasAdjustment,
        };
      }

      this._addressProvider = new AddressProviderFromJson(
        <AddressMap>mainNetDefaultConfig.contracts,
      );

      this._lcd = new LCDClient(mainNetDefaultConfig.lcd);
    } else if (options.network === NETWORKS.MAINNET) {
      if (options.gasConfig === undefined) {
        this._gasConfig = {
          gasPrices: mainNetDefaultConfig.lcd.gasPrices,
          gasAdjustment: mainNetDefaultConfig.lcd.gasAdjustment,
        };
      }

      this._addressProvider = new AddressProviderFromJson(
        <AddressMap>mainNetDefaultConfig.contracts,
      );

      this._lcd = new LCDClient(mainNetDefaultConfig.lcd);
    } else if (options.network === NETWORKS.TESTNET) {
      if (options.gasConfig === undefined) {
        this._gasConfig = {
          gasPrices: tequilaDefaultConfig.lcd.gasPrices,
          gasAdjustment: tequilaDefaultConfig.lcd.gasAdjustment,
        };
      }

      this._addressProvider = new AddressProviderFromJson(
        <AddressMap>tequilaDefaultConfig.contracts,
      );

      this._lcd = new LCDClient(tequilaDefaultConfig.lcd);
    }

    if (options.mnemonicKey) {
      const key = new MnemonicKey({ mnemonic: options.mnemonicKey });
      this._account = this._lcd.wallet(key);
    }

    if (options.privateKey) {
      const key = new RawKey(options.privateKey);
      this._account = this._lcd.wallet(key);
    }
  }

  getAccount(): Wallet {
    return this._account;
  }

  getLcd(): LCDClient {
    return this._lcd;
  }

  /**
   * @param {market} Anchor Deposit Market. For now, it is only Denom.UST.
   * @param {amount} Amount for deposit. The amount will be deposited in micro UST. e.g. 1 ust = 1000000 uust
   *
   * @example
   * const deposit = await anchorEarn.deposit({
      amount: '0.01',
      currency: DENOMS.UST,
    });
   */
  async deposit(
    depositOption: DepositOption,
  ): Promise<OutputImpl | OperationError> {
    const loggable = depositOption.log;
    const customSigner = depositOption.customSigner;
    const customBroadcaster = depositOption.customBroadcaster;
    const address = depositOption.address;

    if (!assertMarket(depositOption.currency)) {
      throw new Error('Invalid Market');
    }

    assertInput<Msg[], StdTx>(customSigner, customBroadcaster, address);

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

    const taxFee = await Promise.all([this.getTax(depositOption.amount)]);

    if (customBroadcaster) {
      return Promise.resolve()
        .then(() => operation.generateWithAddress(address))
        .then((tx) =>
          customBroadcaster(tx).then((result) => {
            return this.getFinalOutput(
              TxType.DEPOSIT,
              taxFee[0],
              undefined,
              result,
              loggable,
            );
          }),
        );
    } else {
      return Promise.resolve()
        .then(() => operation.generateWithAddress(address))
        .then((tx) =>
          customSigner
            ? customSigner(tx)
            : operation.creatTx(this._account, {
                gasPrices: this._gasConfig.gasPrices,
                gasAdjustment: this._gasConfig.gasAdjustment,
              }),
        )
        .then((signedTx: StdTx) => sendSignedTransaction(this._lcd, signedTx))
        .then((result: TxInfo | BlockTxBroadcastResult) => {
          return this.getFinalOutput(
            TxType.DEPOSIT,
            taxFee[0],
            result,
            undefined,
            loggable,
          );
        });
    }
  }

  /**
   * @param {market} Anchor Deposit Market.
   * @param {amount} Amount for withdraw. The amount will be withdrawn in micro UST. e.g. 1 ust = 1000000 uust
   *
   * @example
   * const withdraw = await anchorEarn.withdraw({
      amount: '0.01',
      currency: DENOMS.UST,
    });
   */
  async withdraw(
    withdrawOption: WithdrawOption,
  ): Promise<OutputImpl | OperationError> {
    const loggable = withdrawOption.log;
    const customSigner = withdrawOption.customSigner;
    const customBroadcaster = withdrawOption.customBroadcaster;

    const address = withdrawOption.address;

    if (withdrawOption.amount == '0') {
      throw new Error('Invalid zero amount');
    }

    assertInput<Msg[], StdTx>(customSigner, customBroadcaster, address);

    address
      ? await this.assertAUSTBalance(withdrawOption.amount, address)
      : await this.assertAUSTBalance(withdrawOption.amount);

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

    const operation = new OperationImpl(
      fabricateMarketRedeemStable,
      withdrawOption,
      this._addressProvider,
    );

    if (customBroadcaster) {
      return Promise.resolve()
        .then(() => operation.generateWithAddress(address))
        .then((tx) =>
          customBroadcaster(tx).then((result) => {
            return this.getFinalOutput(
              TxType.DEPOSIT,
              WITHDRAW_TAX_FEE,
              undefined,
              result,
              loggable,
            );
          }),
        );
    } else {
      return Promise.resolve()
        .then(() => operation.generateWithAddress(address))
        .then((tx) =>
          customSigner
            ? customSigner(tx)
            : operation.creatTx(this._account, {
                gasPrices: this._gasConfig.gasPrices,
                gasAdjustment: this._gasConfig.gasAdjustment,
              }),
        )
        .then((signedTx: StdTx) => sendSignedTransaction(this._lcd, signedTx))
        .then((result) => {
          return this.getFinalOutput(
            TxType.WITHDRAW,
            WITHDRAW_TAX_FEE,
            result,
            undefined,
            loggable,
            requestedAmount,
          );
        });
    }
  }

  /**
   * @param {denom} currency denomination for send. it could be either DENOMS.UST, DENOMS.AUST
   * @param {amount} Amount for withdraw. The amount will be withdrawn in micro UST. e.g. 1 ust = 1000000 uust
   * @param {recipient} Recipient's terra address
   *
   * @example
   * const sendAust = await anchorEarn.send(DENOMS.AUST, {
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
    });
   */

  async send(options: SendOption): Promise<OutputImpl | OperationError> {
    const customSigner = options.customSigner;
    const customBroadcaster = options.customBroadcaster;
    const address = options.address;

    assertInput<Msg[], StdTx>(customSigner, customBroadcaster, address);

    switch (options.currency) {
      case DENOMS.UST: {
        return this.sendUSTHelper(options);
        break;
      }
      case DENOMS.AUST: {
        return this.sendAUSTHelper(options);
        break;
      }
    }
  }

  // /**
  //  * @param {currencies} List of currency currencies.
  //  *
  //  * @example
  //  * const userBalance = await anchorEarn.balance({
  //     currencies: [DENOMS.UST, DENOMS.KRW],
  //   });
  //  */
  //
  async balance(options: QueryOption): Promise<BalanceOutput> {
    const balances = await Promise.all(
      options.currencies.map(async (currency) => {
        const balance = await this.getCurrencyState(
          currency,
          accAddress(options.address),
        );
        return balance;
      }),
    );

    const height = await Promise.all([this.getHeight()]);

    const totalBalance = await Promise.all([this.getTotalBalance(balances)]);

    const totalDeposit = await Promise.all([this.getTotalDeposit(balances)]);

    return new BalanceOutput(
      this._lcd.config.chainID,
      height[0],
      options.address ? options.address : this.getAddress(),
      balances,
      getNaturalDecimals(totalBalance[0]),
      getNaturalDecimals(totalDeposit[0]),
    );
  }

  /**
   * @param {currencies} List of market currencies.
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
          const state = await this.getCurrencyMarketState(currency);
          return state;
        }),
    );

    const height = await Promise.all([await this.getHeight()]);

    return new MarketOutput(this._lcd.config.chainID, height[0], markets);
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
    return userCoins.get(getNativeBalanceOption.currency);
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
      return this._account.key.accAddress;
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

    const balance: BalanceEntry = {
      currency: mapCurrencyToUST(currency),
      account_balance: getNaturalDecimals(accountBalance[0].amount.toString()),
      deposit_balance: getNaturalDecimals(
        new Int(
          new Dec(depositBalance[0].balance).mul(exchangeRate).toString(),
        ).toString(),
      ),
    };

    return balance;
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
    const APY = new Dec(NUMBER_OF_BLOCKS).mul(depositRate[0]);

    const entry: MarketEntry = {
      currency: mapCurrencyToUST(currency),
      liquidity: getNaturalDecimals(contractBalance.amount.toString()),
      APY: APY.toString(),
    };

    return entry;
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
    type: TxType,
    taxFee: string,
    loggable?: (data: OperationError | OutputImpl) => Promise<void> | void,
    requestedAmount?: string,
  ): OutputImpl | OperationError {
    let result: OperationError | OutputImpl;
    if (isTxError(tx)) {
      result = {
        type: type,
        chain: CHAINS.TERRA,
        error_msg: tx.raw_log,
      } as OperationError;
      if (loggable) {
        loggable(result);
      }
    } else {
      result = new OutputImpl(
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
    }
    return result;
  }

  private async sendUSTHelper(
    options: SendOption,
  ): Promise<OutputImpl | OperationError> {
    const loggable = options.log;
    const customSigner = options.customSigner;
    const customBroadcaster = options.customBroadcaster;
    const address = options.address;

    const taxFee = await Promise.all([this.getTax(options.amount)]);

    const coin = new Coin('uusd', getMicroAmount(options.amount));
    address
      ? await this.assertUSTBalance(
          DENOMS.UST,
          options.amount,
          accAddress(address),
        )
      : await this.assertUSTBalance(DENOMS.UST, options.amount);
    if (customBroadcaster) {
      return Promise.resolve()
        .then(() =>
          createNativeSend(accAddress(address), {
            recipient: accAddress(options.recipient),
            coin,
          }),
        )
        .then((tx) =>
          customBroadcaster([tx]).then((result) => {
            return this.getFinalOutput(
              TxType.DEPOSIT,
              WITHDRAW_TAX_FEE,
              undefined,
              result,
              loggable,
            );
          }),
        );
    } else {
      return Promise.resolve()
        .then(() =>
          customSigner
            ? createNativeSend(accAddress(address), {
                recipient: accAddress(options.recipient),
                coin,
              })
            : createNativeSend(this._account.key.accAddress, {
                recipient: accAddress(options.recipient),
                coin,
              }),
        )
        .then((tx) =>
          customSigner
            ? customSigner([tx])
            : createAndSignMsg(
                this._account,
                {
                  gasAdjustment: this._gasConfig.gasAdjustment,
                  gasPrices: this._gasConfig.gasPrices,
                },
                [tx],
              ),
        )
        .then((signedTx: StdTx) => sendSignedTransaction(this._lcd, signedTx))
        .then((result) => {
          return this.getFinalOutput(
            TxType.SEND,
            taxFee[0],
            result,
            undefined,
            loggable,
          );
        });
    }
  }

  private async sendAUSTHelper(
    options: SendOption,
  ): Promise<OutputImpl | OperationError> {
    const loggable = options.log;
    const customSigner = options.customSigner;
    const customBroadcaster = options.customBroadcaster;
    const address = options.address;

    const taxFee = await Promise.all([this.getTax(options.amount)]);

    address
      ? this.assertAUSTBalance(options.amount, accAddress(address))
      : this.assertUSTBalance(DENOMS.UST, options.amount);
    let transferAUST: Msg[];
    if (customSigner || (customBroadcaster && address)) {
      transferAUST = fabricateCw20Transfer({
        address: accAddress(address),
        amount: options.amount,
        recipient: accAddress(options.recipient),
        contract_address: this._addressProvider.aTerra(DENOMS.UST),
      });
    } else {
      transferAUST = fabricateCw20Transfer({
        address: this._account.key.accAddress,
        amount: options.amount,
        recipient: accAddress(options.recipient),
        contract_address: this._addressProvider.aTerra(DENOMS.UST),
      });
    }

    if (customBroadcaster) {
      return Promise.resolve().then(() =>
        customBroadcaster(transferAUST).then((result) => {
          return this.getFinalOutput(
            TxType.DEPOSIT,
            WITHDRAW_TAX_FEE,
            undefined,
            result,
            loggable,
          );
        }),
      );
    }
    return Promise.resolve()
      .then(() =>
        customSigner
          ? customSigner(transferAUST)
          : createAndSignMsg(
              this._account,
              {
                gasPrices: this._gasConfig.gasPrices,
                gasAdjustment: this._gasConfig.gasAdjustment,
              },
              transferAUST,
            ),
      )
      .then((signedTx: StdTx) => sendSignedTransaction(this._lcd, signedTx))
      .then((result) => {
        return this.getFinalOutput(
          TxType.SENDAUST,
          taxFee[0],
          result,
          undefined,
          loggable,
        );
      });
  }

  private async getFinalOutput(
    type: TxType,
    taxFee: string,
    txResult?: SyncTxBroadcastResult,
    txHash?: string,
    loggable?: (data: OperationError | OutputImpl) => Promise<void> | void,
    requestedAmount?: string,
  ): Promise<OutputImpl | OperationError> {
    if (txResult && isTxError(txResult)) {
      const result = {
        type: type,
        chain: CHAINS.TERRA,
        error_msg: txResult.raw_log,
      } as OperationError;
      if (loggable) {
        loggable(result);
      }
      return result;
    } else {
      const hash = txHash ? txHash : txResult.txhash;
      return await new Promise((resolve) => {
        const interval = setInterval(() => {
          this._lcd.tx
            .txInfo(hash)
            .then((result) => {
              clearInterval(interval);
              const output = this.generateOutput(
                result,
                type,
                taxFee,
                loggable,
                requestedAmount,
              );
              resolve(output);
            })
            .catch(() => {});
        }, 1000);
      });
    }
  }
}
