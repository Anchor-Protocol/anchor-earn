"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fabricateMarketRedeemStable = void 0;
const terra_js_1 = require("@terra-money/terra.js");
const create_hook_msg_1 = require("../utils/create-hook-msg");
const utils_1 = require("../utils");
var accAddress = utils_1.Parse.accAddress;
var dec = utils_1.Parse.dec;
/**
 * @param address Client’s Terra address.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 * @param amount Amount of a stablecoin to redeem, or amount of an aToken (aTerra) to redeem (specified by currency).
 */
const fabricateMarketRedeemStable = ({ address, currency, amount, }) => (addressProvider) => {
    const marketAddress = addressProvider.market(currency);
    const aTokenAddress = addressProvider.aTerra(currency);
    return [
        new terra_js_1.MsgExecuteContract(accAddress(address), aTokenAddress, {
            send: {
                contract: marketAddress,
                amount: new terra_js_1.Int(new terra_js_1.Dec(dec(amount)).mul(1000000)).toString(),
                msg: (0, create_hook_msg_1.createHookMsg)({
                    redeem_stable: {},
                }),
            },
        }),
    ];
};
exports.fabricateMarketRedeemStable = fabricateMarketRedeemStable;
