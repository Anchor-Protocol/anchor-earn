"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerraAnchorEarn = void 0;
const terra_js_1 = require("@terra-money/terra.js");
const operation_1 = require("./operation");
const fabricators_1 = require("../fabricators");
const anchorearn_default_mainnet_1 = __importDefault(require("../data/anchorearn-default-mainnet"));
const anchorearn_default_testnet_1 = __importDefault(require("../data/anchorearn-default-testnet"));
const utils_1 = require("../utils");
const address_provider_1 = require("../address-provider");
const tx_output_1 = require("./tx-output");
const core_1 = require("@terra-money/terra.js/dist/core");
const user_query_output_1 = require("./user-query-output");
const types_1 = require("./types");
const output_1 = require("./output");
const facade_1 = require("../facade");
const assert_inputs_1 = require("../utils/assert-inputs");
const tee_1 = require("../utils/tee");
const sdk_errors_1 = require("../utils/sdk-errors");
var accAddress = utils_1.Parse.accAddress;
var assertMarket = utils_1.Parse.assertMarket;
var mapCurrencyToUST = utils_1.Parse.mapCurrencyToUST;
var mapCurrencyToUSD = utils_1.Parse.mapCurrencyToUSD;
var getNaturalDecimals = utils_1.Parse.getNaturalDecimals;
var getMicroAmount = utils_1.Parse.getMicroAmount;
const BLOCKS_IN_YEAR = 4656810;
const defaultGasConfigMap = {
    [output_1.NETWORKS.COLUMBUS_5]: {
        gasPrices: anchorearn_default_mainnet_1.default.lcd.gasPrices,
        gasAdjustment: anchorearn_default_mainnet_1.default.lcd.gasAdjustment,
    },
    [output_1.NETWORKS.BOMBAY_12]: {
        gasPrices: anchorearn_default_testnet_1.default.lcd.gasPrices,
        gasAdjustment: anchorearn_default_testnet_1.default.lcd.gasAdjustment,
    },
};
const defaultAddressProvider = {
    [output_1.NETWORKS.COLUMBUS_5]: new address_provider_1.AddressProviderFromJson(anchorearn_default_mainnet_1.default.contracts),
    [output_1.NETWORKS.BOMBAY_12]: new address_provider_1.AddressProviderFromJson(anchorearn_default_testnet_1.default.contracts),
};
const defaultLCDConfig = {
    [output_1.NETWORKS.COLUMBUS_5]: anchorearn_default_mainnet_1.default.lcd,
    [output_1.NETWORKS.BOMBAY_12]: anchorearn_default_testnet_1.default.lcd,
};
class TerraAnchorEarn {
    constructor(options) {
        const address = options.address;
        const gasConfig = defaultGasConfigMap[options.network] || {
            gasPrices: anchorearn_default_mainnet_1.default.lcd.gasPrices,
            gasAdjustment: anchorearn_default_mainnet_1.default.lcd.gasAdjustment,
        };
        const addressProvider = defaultAddressProvider[options.network] ||
            new address_provider_1.AddressProviderFromJson(anchorearn_default_mainnet_1.default.contracts);
        const lcd = new terra_js_1.LCDClient(defaultLCDConfig[options.network]);
        const account = options.mnemonic
            ? lcd.wallet(new terra_js_1.MnemonicKey({ mnemonic: options.mnemonic }))
            : null;
        const privateKey = options.privateKey
            ? lcd.wallet(new terra_js_1.RawKey(options.privateKey))
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
    getAccount() {
        return this._account;
    }
    getLcd() {
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
    deposit(depositOption) {
        return __awaiter(this, void 0, void 0, function* () {
            const customSigner = depositOption.customSigner;
            const customBroadcaster = depositOption.customBroadcaster;
            const address = this.getAddress();
            if (!assertMarket(depositOption.currency)) {
                throw new Error('Invalid Market');
            }
            (0, assert_inputs_1.assertInput)(customSigner, customBroadcaster);
            yield this.assertUSTBalance(depositOption.currency, depositOption.amount, address);
            const operation = new operation_1.OperationImpl(fabricators_1.fabricateMarketDepositStableCoin, depositOption, this._addressProvider);
            return this.operationHelper(depositOption, types_1.OperationType.DEPOSIT, operation.generateWithAddress(address));
        });
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
    withdraw(withdrawOption) {
        return __awaiter(this, void 0, void 0, function* () {
            const customSigner = withdrawOption.customSigner;
            const customBroadcaster = withdrawOption.customBroadcaster;
            const address = this.getAddress();
            if (withdrawOption.amount == '0') {
                throw new Error('Invalid zero amount');
            }
            (0, assert_inputs_1.assertInput)(customSigner, customBroadcaster);
            let requestedAmount = '0';
            switch (withdrawOption.currency) {
                case address_provider_1.DENOMS.AUST: {
                    withdrawOption.currency = address_provider_1.DENOMS.UST;
                    const exchangeRate = yield this.getExchangeRate({
                        market: address_provider_1.DENOMS.UST,
                    });
                    requestedAmount = getNaturalDecimals(getMicroAmount(withdrawOption.amount).mul(exchangeRate).toString());
                    break;
                }
                case address_provider_1.DENOMS.UST: {
                    const exchangeRate = yield this.getExchangeRate({
                        market: address_provider_1.DENOMS.UST,
                    });
                    requestedAmount = withdrawOption.amount;
                    withdrawOption.amount = getNaturalDecimals(getMicroAmount(withdrawOption.amount).div(exchangeRate).toString());
                }
            }
            yield this.assertAUSTBalance(withdrawOption.amount, address ? address : undefined);
            const operation = new operation_1.OperationImpl(fabricators_1.fabricateMarketRedeemStable, withdrawOption, this._addressProvider);
            return this.operationHelper(withdrawOption, types_1.OperationType.WITHDRAW, operation.generateWithAddress(address), requestedAmount);
        });
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
    send(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const customSigner = options.customSigner;
            const customBroadcaster = options.customBroadcaster;
            const address = this.getAddress();
            (0, assert_inputs_1.assertInput)(customSigner, customBroadcaster);
            switch (options.currency) {
                case address_provider_1.DENOMS.UST: {
                    const coin = new terra_js_1.Coin('uusd', getMicroAmount(options.amount));
                    yield this.assertUSTBalance(address_provider_1.DENOMS.UST, options.amount, accAddress(address));
                    const msg = (0, operation_1.createNativeSend)(address, {
                        recipient: options.recipient,
                        coin: coin,
                    });
                    return this.operationHelper(options, types_1.OperationType.SEND, [msg]);
                }
                case address_provider_1.DENOMS.AUST: {
                    options.currency = address_provider_1.DENOMS.UST;
                    yield this.assertAUSTBalance(options.amount, address ? accAddress(address) : undefined);
                    const operation = new operation_1.OperationImpl(fabricators_1.fabricateCw20Transfer, options, this._addressProvider);
                    return this.operationHelper(options, types_1.OperationType.SENDAUST, operation.generateWithAddress(address));
                }
            }
        });
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
    balance(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const address = this.getAddress();
            const balances = yield Promise.all(options.currencies.map((currency) => __awaiter(this, void 0, void 0, function* () {
                return yield this.getCurrencyState(currency, accAddress(address));
            })));
            const height = yield Promise.all([this.getHeight()]);
            const totalBalance = yield Promise.all([this.getTotalBalance(balances)]);
            const totalDeposit = yield Promise.all([this.getTotalDeposit(balances)]);
            return new user_query_output_1.BalanceOutput(output_1.CHAINS.TERRA, this._lcd.config.chainID, height[0], address, balances, getNaturalDecimals(totalBalance[0]), getNaturalDecimals(totalDeposit[0]));
        });
    }
    /**
     * @param {currencies} options.currencies is a list of market currencies.
     *
     * @example
     * const userBalance = await anchorEarn.currency({
        currencies: [DENOMS.UST, DENOMS.KRW],
      });
     */
    market(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const markets = yield Promise.all(options.currencies
                .filter((currency) => assertMarket(currency))
                .map((currency) => __awaiter(this, void 0, void 0, function* () {
                return yield this.getCurrencyMarketState(currency);
            })));
            const height = yield Promise.all([yield this.getHeight()]);
            return new facade_1.MarketOutput(output_1.CHAINS.TERRA, this._lcd.config.chainID, height[0], markets);
        });
    }
    getAUstBalance(getAUstBalanceOption) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, fabricators_1.queryAUSTBalance)({
                lcd: this._lcd,
                address: accAddress(getAUstBalanceOption.address),
                market: getAUstBalanceOption.market,
            })(this._addressProvider);
        });
    }
    getNativeBalance(getNativeBalanceOption) {
        return __awaiter(this, void 0, void 0, function* () {
            const userCoins = yield this._lcd.bank.balance(accAddress(getNativeBalanceOption.address));
            const coins = userCoins[0];
            return coins.get(getNativeBalanceOption.currency);
        });
    }
    getExchangeRate(getExchangeRateOption) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockHeight = yield this.getHeight();
            const state = yield (0, fabricators_1.queryMarketEpochState)({
                lcd: this._lcd,
                market: getExchangeRateOption.market,
                block_height: blockHeight,
            })(this._addressProvider);
            return state.exchange_rate;
        });
    }
    getDepositRate(getDepositRateOption) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield (0, fabricators_1.queryOverseerEpochState)({
                lcd: this._lcd,
                market: getDepositRateOption.market,
            })(this._addressProvider);
            return state.deposit_rate;
        });
    }
    getAddress() {
        if (this._address === undefined) {
            if (this._account === undefined) {
                return undefined;
            }
            else {
                return this._account.key.accAddress;
            }
        }
        else {
            return this._address;
        }
    }
    getHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            const blockInfo = yield this._lcd.tendermint.blockInfo();
            return utils_1.Parse.int(blockInfo.block.header.height);
        });
    }
    getCurrencyState(currency, address) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let accountBalance;
            let depositBalance;
            if (address) {
                accountBalance = yield Promise.all([
                    this.getNativeBalance({
                        address: address,
                        currency,
                    }),
                ]);
                depositBalance = yield Promise.all([
                    this.getAUstBalance({
                        address: address,
                        market: currency,
                    }),
                ]);
            }
            else {
                accountBalance = yield Promise.all([
                    this.getNativeBalance({
                        address: this.getAddress(),
                        currency,
                    }),
                ]);
                depositBalance = yield Promise.all([
                    this.getAUstBalance({
                        address: this.getAddress(),
                        market: currency,
                    }),
                ]);
            }
            const exchangeRate = yield this.getExchangeRate({
                market: currency,
            });
            return {
                currency: mapCurrencyToUST(currency),
                account_balance: getNaturalDecimals((_a = accountBalance[0]) === null || _a === void 0 ? void 0 : _a.amount.toString()),
                deposit_balance: getNaturalDecimals(new terra_js_1.Int(new terra_js_1.Dec(depositBalance[0].balance).mul(exchangeRate).toString()).toString()),
            };
        });
    }
    getTotalBalance(balances) {
        return __awaiter(this, void 0, void 0, function* () {
            let totalBalance = 0;
            for (const entry of balances) {
                if (mapCurrencyToUSD(entry.currency) !== address_provider_1.DENOMS.UST) {
                    const swapCoin = yield this._lcd.market.swapRate(new terra_js_1.Coin(entry.currency, entry.account_balance), address_provider_1.DENOMS.UST);
                    const inMicro = utils_1.Parse.getMicroAmount(swapCoin.amount.toString());
                    totalBalance += utils_1.Parse.int(inMicro.toString());
                }
                else {
                    const inMicro = utils_1.Parse.getMicroAmount(entry.account_balance);
                    totalBalance += utils_1.Parse.int(inMicro.toString());
                }
            }
            return totalBalance.toString();
        });
    }
    getTotalDeposit(balances) {
        return __awaiter(this, void 0, void 0, function* () {
            let totalBalance = 0;
            for (const entry of balances) {
                if (mapCurrencyToUSD(entry.currency) !== address_provider_1.DENOMS.UST &&
                    utils_1.Parse.int(entry.deposit_balance) > 0) {
                    const swapCoin = yield this._lcd.market.swapRate(new terra_js_1.Coin(entry.currency, entry.deposit_balance), address_provider_1.DENOMS.UST);
                    const inMicro = utils_1.Parse.getMicroAmount(swapCoin.amount.toString());
                    totalBalance += utils_1.Parse.int(inMicro.toString());
                }
                else {
                    const inMicro = utils_1.Parse.getMicroAmount(entry.deposit_balance);
                    totalBalance += utils_1.Parse.int(inMicro.toString());
                }
            }
            return totalBalance.toString();
        });
    }
    getCurrencyMarketState(currency) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractBalance = yield this.getNativeBalance({
                address: this._addressProvider.market(currency),
                currency,
            });
            const depositRate = yield Promise.all([
                this.getDepositRate({ market: currency }),
            ]);
            const APY = new terra_js_1.Dec(BLOCKS_IN_YEAR).mul(depositRate[0]);
            return {
                currency: mapCurrencyToUST(currency),
                liquidity: getNaturalDecimals(contractBalance.amount.toString()),
                APY: APY.toString(),
            };
        });
    }
    assertUSTBalance(market, requestedAmount, address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (requestedAmount == '0') {
                throw new Error('Invalid zero amount');
            }
            let ustBalance;
            if (address) {
                ustBalance = yield this.getNativeBalance({
                    address: accAddress(address),
                    currency: market,
                });
            }
            else {
                ustBalance = yield this.getNativeBalance({
                    address: this._account.key.accAddress,
                    currency: market,
                });
            }
            if (ustBalance === undefined) {
                throw new Error('Insufficient ust balance');
            }
            const userRequest = utils_1.Parse.getMicroAmount(requestedAmount);
            if (userRequest.greaterThan(ustBalance.amount)) {
                throw new Error(`Insufficient ust balance ${userRequest.toString()}> ${ustBalance.toString()}. Cannot deposit`);
            }
        });
    }
    assertAUSTBalance(requestedAmount, address) {
        return __awaiter(this, void 0, void 0, function* () {
            const austBalance = address
                ? yield this.getAUstBalance({
                    address: accAddress(address),
                    market: address_provider_1.DENOMS.UST,
                })
                : yield this.getAUstBalance({
                    address: this._account.key.accAddress,
                    market: address_provider_1.DENOMS.UST,
                });
            const userRequest = utils_1.Parse.getMicroAmount(requestedAmount);
            if (austBalance.balance === '0' || austBalance.balance === undefined) {
                throw new Error(`There is no deposit for the user`);
            }
            if (userRequest.greaterThan(austBalance.balance)) {
                throw new Error(`Cannot withdraw more than balance. ${userRequest.toString()} > ${austBalance.balance}`);
            }
        });
    }
    getTax(requestAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            //get the taxCap
            const taxCap = yield this._lcd.treasury.taxCap(address_provider_1.DENOMS.UST);
            //get the height for taxRate
            const height = yield Promise.all([this.getHeight()]);
            // get the current taxRate
            const taxRate = yield this._lcd.treasury.taxRate(height[0]);
            // Tax = min(transfer_amount * tax_rate, tax_cap)
            return terra_js_1.Dec.min(taxRate.mul(requestAmount), taxCap.amount.toString()).toString();
        });
    }
    generateOutput(tx, type, taxFee, loggable, requestedAmount) {
        const result = new tx_output_1.TxOutput(tx, type, output_1.CHAINS.TERRA, this._lcd.config.chainID, taxFee, +new core_1.Coins(this._gasConfig.gasPrices).get('uusd').amount, requestedAmount);
        if (loggable) {
            loggable(result);
        }
        return result;
    }
    operationHelper(options, txType, msg, requestedAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            const customSigner = options.customSigner;
            const loggable = options.log || (() => void 0);
            const customBroadcaster = options.customBroadcaster;
            const taxFee = yield Promise.all([this.getTax(options.amount)]);
            const signAndBroadcast = (unsignedTx) => __awaiter(this, void 0, void 0, function* () {
                // if customBroadcaster is provided,
                // that's it!
                if (customBroadcaster)
                    return customBroadcaster(unsignedTx);
                // control flow
                const createTx = customSigner ||
                    ((msg) => {
                        return (0, operation_1.createAndSignMsg)(this.getAccount(), {
                            gasPrices: this._gasConfig.gasPrices,
                            gasAdjustment: this._gasConfig.gasAdjustment,
                        }, msg);
                    });
                return Promise.resolve()
                    .then(() => {
                    return createTx(unsignedTx);
                })
                    .then((0, tee_1.tee)((_signedTx) => {
                    loggable({
                        type: (0, tx_output_1.getTxType)(txType),
                        status: output_1.STATUS.IN_PROGRESS,
                        currency: mapCurrencyToUST(options.currency),
                        amount: options.amount,
                        //txFee: mapCoinToUST(signedTx.fee.amount),
                        deductedTax: '0',
                    });
                }))
                    .then((signedTx) => {
                    return (0, operation_1.sendSignedTransaction)(this._lcd, signedTx);
                })
                    .then((result) => {
                    if ((0, terra_js_1.isTxError)(result)) {
                        if (typeof result.code === 'number') {
                            return Promise.reject(new Error((0, sdk_errors_1.getTerraError)(result.raw_log, result.code)));
                        }
                        else {
                            return Promise.reject(new Error((0, sdk_errors_1.getTerraError)(result.raw_log, parseInt(result.code, 10))));
                        }
                    }
                    else {
                        return result.txhash;
                    }
                });
            });
            return Promise.resolve()
                .then(() => {
                return msg;
            })
                .then((tx) => signAndBroadcast(tx))
                .then((txhash) => {
                return this.getOutputFromHash(txType, taxFee[0], txhash, loggable, requestedAmount);
            })
                .catch((e) => {
                const error = {
                    type: output_1.TxType.SEND,
                    chain: output_1.CHAINS.TERRA,
                    network: this._lcd.config.chainID,
                    error_msg: e.message,
                    status: output_1.STATUS.UNSUCCESSFUL,
                };
                loggable(error);
                throw new Error(e.message);
            });
        });
    }
    getOutputFromHash(type, taxFee, txHash, loggable, requestedAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            const txInfo = yield this.getTxInfo(txHash);
            return this.generateOutput(txInfo, type, taxFee, loggable, requestedAmount);
        });
    }
    getTxInfo(txHash) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve) => {
                const interval = setInterval(() => {
                    this._lcd.tx
                        .txInfo(txHash)
                        .then((result) => {
                        clearInterval(interval);
                        resolve(result);
                    })
                        .catch(() => { });
                }, 1000);
            });
        });
    }
}
exports.TerraAnchorEarn = TerraAnchorEarn;
