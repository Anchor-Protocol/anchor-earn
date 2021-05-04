import {
  Coin,
  Dec,
  Int,
  isTxError,
  LCDClient,
  MnemonicKey,
  Msg,
  RawKey, StdTx,
  Wallet,
} from '@terra-money/terra.js';
import {
  createNativeSend,
  createAndSignMsg,
  OperationImpl,
  send_signed_transaction,
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
import { Parse } from '../utils/parse-input';
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
  CHAIN,
  DepositOption,
  NETWORKS,
  QueryOption,
  SendOption,
  TxType,
  WithdrawOption,
} from './types';
import { BlockTxBroadcastResult } from '@terra-money/terra.js/dist/client/lcd/api/TxAPI';
import { MarketOutput } from '../facade';
import privateKey = Parse.privateKey;
import accAddress = Parse.accAddress;
import dec = Parse.dec;
import assertMarket = Parse.assertMarket;
import getAccessToken = Parse.getAccessToken;
import mapCurrencyToUST = Parse.mapCurrencyToUST;
import mapCurrencyToUSD = Parse.mapCurrencyToUSD;

const NUMBER_OF_BLOCKS = 4_906_443;

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
      accessToken: '....',
    });
 */

interface AnchorEarnOptions {
  network?: NETWORKS;
  accessToken?: string;
  privateKey?: Buffer;
  MnemonicKey?: string;
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

    if (options.accessToken) {
      const key = new RawKey(privateKey(getAccessToken(options.accessToken)));
      this._account = this._lcd.wallet(key);
    }

    if (options.accessToken === undefined && options.MnemonicKey) {
      const key = new MnemonicKey({ mnemonic: options.MnemonicKey });
      this._account = this._lcd.wallet(key);
    }

    if (options.accessToken === undefined && options.privateKey) {
      const key = new RawKey(privateKey(options.accessToken));
      this._account = this._lcd.wallet(key);
    }
  }

  get_account(): Wallet {
    return this._account;
  }

  get_lcd(): LCDClient {
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
    const address = depositOption.address;

    if (!assertMarket(depositOption.currency)) {
      throw new Error('Invalid Market');
    }

    if (address && customSigner) {
      await this.assertUSTBalance(
        depositOption.currency,
        depositOption.amount,
        address,
      );
    } else {
      await this.assertUSTBalance(depositOption.currency, depositOption.amount);
    }

    if (customSigner && address == undefined) {
      throw new Error('Address must be provided');
    }

    const operation = new OperationImpl(
      fabricateMarketDepositStableCoin,
      depositOption,
      this._addressProvider,
    );

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
      .then((signedTx: StdTx) =>
        customSigner
          ? send_signed_transaction(this._lcd, signedTx)
          : operation.execute(this._account, {
              gasPrices: this._gasConfig.gasPrices,
              gasAdjustment: this._gasConfig.gasAdjustment,
            }),
      )
      .then((result) => {
        return this.generate_output(result, TxType.DEPOSIT, loggable);
      });
  }

  /**
   * @param {market} Anchor Deposit Market. For now, it is only Denom.UST.
   * @param {amount} Amount for withdraw. The amount will be withdrawed in micro UST. e.g. 1 ust = 1000000 uust
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
    const address = withdrawOption.address;

    if (withdrawOption.amount == '0') {
      throw new Error('Invalid zero amount');
    }

    if (!assertMarket(withdrawOption.currency)) {
      throw new Error('Invalid Market');
    }

    await this.assertAUSTBalance(withdrawOption.amount);

    const operation = new OperationImpl(
      fabricateMarketRedeemStable,
      withdrawOption,
      this._addressProvider,
    );

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
      .then((signedTx: StdTx) =>
        customSigner
          ? send_signed_transaction(this._lcd, signedTx)
          : operation.execute(this._account, {
              gasPrices: this._gasConfig.gasPrices,
              gasAdjustment: this._gasConfig.gasAdjustment,
            }),
      )
      .then((result) => {
        return this.generate_output(result, TxType.WITHDRAW, loggable);
      });
  }

  /**
   * @param {denom} currency denomination for send. it could be either DENOMS.UST, DENOMS.AUST
   * @param {amount} Amount for withdraw. The amount will be withdrawed in micro UST. e.g. 1 ust = 1000000 uust
   * @param {recipient} Recipient's terra address
   *
   * @example
   * const sendAust = await anchorEarn.send(DENOMS.AUST, {
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
    });
   */

  async send(
    denom: DENOMS,
    options: SendOption,
  ): Promise<OutputImpl | OperationError> {
    const loggable = options.log;
    const customSigner = options.customSigner;
    const address = options.address;

    switch (denom) {
      case DENOMS.UST: {
        await this.assertUSTBalance(DENOMS.UST, options.amount);
        const coin = new Coin(
          'uusd',
          new Int(new Dec(dec(options.amount)).mul(1000000)),
        );

        return Promise.resolve()
          .then(() =>
            customSigner
              ? createNativeSend(address, {
                  recipient: options.recipient,
                  coin,
                })
              : createNativeSend(this._account.key.accAddress, {
                  recipient: options.recipient,
                  coin,
                }),
          )
          .then((tx) =>
            customSigner
              ? customSigner(tx)
              : createAndSignMsg(
                  this._account,
                  {
                    gasAdjustment: this._gasConfig.gasAdjustment,
                    gasPrices: this._gasConfig.gasPrices,
                  },
                  [tx],
                ),
          )
          .then((signedTx: StdTx) => send_signed_transaction(this._lcd, signedTx))
          .then((result) => {
            return this.generate_output(result, TxType.SEND, loggable);
          });
        break;
      }
      case DENOMS.AUST: {
        await this.assertAUSTBalance(options.amount);
        let transferAUST: Msg[];
        if (customSigner && address) {
          transferAUST = fabricateCw20Transfer({
            address: address,
            amount: options.amount,
            recipient: options.recipient,
            contract_address: this._addressProvider.aTerra(DENOMS.UST),
          });
        } else {
          transferAUST = fabricateCw20Transfer({
            address: this._account.key.accAddress,
            amount: options.amount,
            recipient: options.recipient,
            contract_address: this._addressProvider.aTerra(DENOMS.UST),
          });
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
          .then((signedTx: StdTx) => send_signed_transaction(this._lcd, signedTx))
          .then((result) => {
            return this.generate_output(result, TxType.SENDAUST, loggable);
          });
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
        const balance = await this.getCurrencyState(currency, options.address);
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
      totalBalance[0],
      totalDeposit[0],
    );
  }

  /**
   * @param {currencies} List of currency currencies.
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
    getDepositRateoption: GetDepositRateOption,
  ): Promise<string> {
    const state = await queryOverseerEpochState({
      lcd: this._lcd,
      market: getDepositRateoption.market,
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

  private async getSwapRate(offerCoin: Coin, denom: string): Promise<Coin> {
    const destinationCoin = await this._lcd.market.swapRate(offerCoin, denom);
    return destinationCoin;
  }

  private async getCurrencyState(
    currency: DENOMS,
    address?: string,
  ): Promise<BalanceEntry> {
    let account_balance;
    let deposit_balance;
    if (address) {
      account_balance = await Promise.all([
        this.getNativeBalance({
          address: address,
          currency,
        }),
      ]);
      deposit_balance = await Promise.all([
        this.getAUstBalance({
          address: address,
          market: currency,
        }),
      ]);
    } else {
      account_balance = await Promise.all([
        this.getNativeBalance({
          address: this.getAddress(),
          currency,
        }),
      ]);
      deposit_balance = await Promise.all([
        this.getAUstBalance({
          address: this.getAddress(),
          market: currency,
        }),
      ]);
    }

    const exchange_rate = await this.getExchangeRate({
      market: currency,
    });

    const balance: BalanceEntry = {
      currency: mapCurrencyToUST(currency),
      account_balance: account_balance[0].amount.toString(),
      deposit_balance: new Int(
        new Dec(deposit_balance[0].balance).div(exchange_rate).toString(),
      ).toString(),
    };

    return balance;
  }

  private async getTotalBalance(balances: BalanceEntry[]): Promise<string> {
    let totalBalance = 0;
    for (const entry of balances) {
      if (mapCurrencyToUSD(entry.currency) !== 'uusd') {
        const swapCoin = await this._lcd.market.swapRate(
          new Coin(entry.currency, entry.account_balance),
          'uusd',
        );
        totalBalance += Parse.int(swapCoin.amount.toString());
      } else {
        totalBalance += Parse.int(entry.account_balance);
      }
    }
    return totalBalance.toString();
  }

  private async getTotalDeposit(balances: BalanceEntry[]): Promise<string> {
    let totalBalance = 0;
    for (const entry of balances) {
      if (
        mapCurrencyToUSD(entry.currency) !== 'uusd' &&
        Parse.int(entry.deposit_balance) > 0
      ) {
        const swapCoin = await this._lcd.market.swapRate(
          new Coin(entry.currency, entry.deposit_balance),
          'uusd',
        );
        totalBalance += Parse.int(swapCoin.amount.toString());
      } else {
        totalBalance += Parse.int(entry.deposit_balance);
      }
    }
    return totalBalance.toString();
  }

  private async getCurrencyMarketState(currency: DENOMS): Promise<MarketEntry> {
    const contract_balance = await this.getNativeBalance({
      address: this._addressProvider.market(currency),
      currency,
    });

    const depositRate = await Promise.all([
      this.getDepositRate({ market: currency }),
    ]);
    const APY = new Dec(NUMBER_OF_BLOCKS).mul(depositRate[0]);

    const entry: MarketEntry = {
      currency: mapCurrencyToUST(currency),
      liquidity: contract_balance.amount.toString(),
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
        address: address,
        currency: market,
      });
    } else {
      ustBalance = await this.getNativeBalance({
        address: this._account.key.accAddress,
        currency: market,
      });
    }

    const userRequest = new Int(new Dec(dec(requestedAmount)).mul(1000000));

    if (ustBalance.amount < userRequest) {
      throw new Error(
        `Insufficient ust balance ${userRequest.toString()}> ${ustBalance.toString()}. Cannot deposit`,
      );
    }
  }

  private async assertAUSTBalance(requestedAmount: string): Promise<void> {
    const austBalance = await this.getAUstBalance({
      address: this._account.key.accAddress,
      market: DENOMS.UST,
    });
    const userRequest = new Int(new Dec(dec(requestedAmount)).mul(1000000));

    if (austBalance.balance === '0') {
      throw new Error(`There is no deposit for the user`);
    }
    if (new Int(austBalance.balance) < userRequest) {
      throw new Error(
        `Cannot withdraw more than balance. ${userRequest.toString()}> ${
          austBalance.balance
        }`,
      );
    }
  }

  private generate_output(
    tx: BlockTxBroadcastResult,
    type: TxType,
    loggable?: (data: OperationError | OutputImpl) => Promise<void> | void,
  ): OutputImpl | OperationError {
    let result: OperationError | OutputImpl;
    if (isTxError(tx)) {
      result = {
        type: type,
        chain: CHAIN.TERRA,
        error_msg: tx.raw_log,
      } as OperationError;
      if (loggable) {
        loggable(result);
      }
    } else {
      result = new OutputImpl(
        tx,
        type,
        CHAIN.TERRA,
        this._lcd.config.chainID,
        +new Coins(this._gasConfig.gasPrices).get('uusd').amount,
      );
      if (loggable) {
        loggable(result);
      }
    }
    return result;
  }
}
