"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fabricateMarketDepositStableCoin = void 0;
const terra_js_1 = require("@terra-money/terra.js");
const utils_1 = require("../utils");
var accAddress = utils_1.Parse.accAddress;
var dec = utils_1.Parse.dec;
/**
 *
 * @param address Client’s Terra address.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 * @param amount Amount of a stablecoin to deposit.
 */
const fabricateMarketDepositStableCoin = ({ address, currency, amount, }) => (addressProvider) => {
    const mmContractAddress = addressProvider.market(currency);
    return [
        new terra_js_1.MsgExecuteContract(accAddress(address), mmContractAddress, {
            deposit_stable: {},
        }, 
        // coins
        {
            [`${currency}`]: new terra_js_1.Int(new terra_js_1.Dec(dec(amount)).mul(1000000)).toString(),
        }),
    ];
};
exports.fabricateMarketDepositStableCoin = fabricateMarketDepositStableCoin;
