"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parse = exports.aUST = exports.UST = exports.TERRA = void 0;
const terra_js_1 = require("@terra-money/terra.js");
const address_provider_1 = require("../address-provider");
const types_1 = require("../facade/types");
exports.TERRA = 'TERRA_';
exports.UST = 'UST';
exports.aUST = 'aUST';
var Parse;
(function (Parse) {
    function accAddress(input) {
        if (input === undefined)
            return undefined;
        if (!terra_js_1.AccAddress.validate(input)) {
            throw new Error(`Invalid Terra account address: ${input}`);
        }
        return input;
    }
    Parse.accAddress = accAddress;
    function int(input) {
        if (input === undefined) {
            return undefined;
        }
        return Number.parseInt(input);
    }
    Parse.int = int;
    function uint128(input) {
        if (input === undefined) {
            return undefined;
        }
        return new terra_js_1.Int(input);
    }
    Parse.uint128 = uint128;
    function coins(input) {
        if (input === undefined) {
            return undefined;
        }
        return terra_js_1.Coins.fromString(input);
    }
    Parse.coins = coins;
    function dec(input) {
        if (input === undefined) {
            return undefined;
        }
        return new terra_js_1.Dec(input);
    }
    Parse.dec = dec;
    function privateKey(input) {
        if (input === undefined) {
            return undefined;
        }
        return Buffer.from(input, 'base64');
    }
    Parse.privateKey = privateKey;
    function assertMarket(input) {
        return input === address_provider_1.DENOMS.UST;
    }
    Parse.assertMarket = assertMarket;
    function getMicroAmount(input) {
        return new terra_js_1.Int(new terra_js_1.Dec(dec(input)).mul(1000000));
    }
    Parse.getMicroAmount = getMicroAmount;
    function getNaturalDecimals(input) {
        return (+new terra_js_1.Int(input).toString() / 1000000).toString();
    }
    Parse.getNaturalDecimals = getNaturalDecimals;
    function subNaturalDecimals(minuend, subtrahend) {
        const a = new terra_js_1.Int(new terra_js_1.Dec(minuend).mul(1000000));
        const b = new terra_js_1.Int(new terra_js_1.Dec(subtrahend).mul(1000000));
        return getNaturalDecimals(a.sub(b).toString());
    }
    Parse.subNaturalDecimals = subNaturalDecimals;
    function getPrivateKey(input) {
        if (!input.includes(exports.TERRA)) {
            throw new Error('Access token is not correct');
        }
        return input.split('_')[1];
    }
    Parse.getPrivateKey = getPrivateKey;
    function generateTerraAccessToken(input) {
        return exports.TERRA.concat(input.toString('base64')).toString();
    }
    Parse.generateTerraAccessToken = generateTerraAccessToken;
    function mapCurrencyToUST(input) {
        if (input && input === 'uusd') {
            return exports.UST;
        }
        return input;
    }
    Parse.mapCurrencyToUST = mapCurrencyToUST;
    function mapCurrencyToUSD(input) {
        if (input && input === exports.UST) {
            return 'uusd';
        }
        return input;
    }
    Parse.mapCurrencyToUSD = mapCurrencyToUSD;
    function mapCoinToUST(input) {
        return getNaturalDecimals(input.get('uusd').amount.toString()).concat(' UST');
    }
    Parse.mapCoinToUST = mapCoinToUST;
    function processLog(txLogs, type) {
        let result;
        switch (type) {
            case types_1.OperationType.DEPOSIT: {
                txLogs[0].events.forEach((e) => {
                    if (e.type === 'transfer') {
                        e.attributes.forEach((k) => {
                            if (k.key === 'amount') {
                                const coin = terra_js_1.Coin.fromString(k.value);
                                result = [getNaturalDecimals(coin.amount.toString()), exports.UST];
                            }
                        });
                    }
                });
                break;
            }
            case types_1.OperationType.WITHDRAW: {
                txLogs[0].events.forEach((e) => {
                    if (e.type === 'transfer') {
                        e.attributes.forEach((k) => {
                            if (k.key === 'amount') {
                                const coin = terra_js_1.Coin.fromString(k.value);
                                result = [getNaturalDecimals(coin.amount.toString()), exports.UST];
                            }
                        });
                    }
                });
                break;
            }
            case types_1.OperationType.SEND: {
                txLogs[0].events.forEach((e) => {
                    if (e.type === 'transfer') {
                        e.attributes.forEach((k) => {
                            if (k.key === 'amount') {
                                const coin = terra_js_1.Coin.fromString(k.value);
                                result = [getNaturalDecimals(coin.amount.toString()), exports.UST];
                            }
                        });
                    }
                });
                break;
            }
            case types_1.OperationType.SENDAUST: {
                txLogs[0].events.forEach((e) => {
                    if (e.type === 'from_contract') {
                        e.attributes.forEach((k) => {
                            if (k.key === 'amount') {
                                result = [getNaturalDecimals(k.value), exports.aUST];
                            }
                        });
                    }
                });
                break;
            }
        }
        return result;
    }
    Parse.processLog = processLog;
})(Parse = exports.Parse || (exports.Parse = {}));
