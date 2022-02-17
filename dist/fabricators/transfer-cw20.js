"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fabricateCw20Transfer = void 0;
const terra_js_1 = require("@terra-money/terra.js");
const utils_1 = require("../utils");
var accAddress = utils_1.Parse.accAddress;
var dec = utils_1.Parse.dec;
/**
 * @param address Client’s Terra address.
 * @param contract_address: cw20 token contract address.
 * @param amount Amount of a stablecoin to deposit.
 * @param recipient: Client’s Terra address.
 */
const fabricateCw20Transfer = ({ address, currency, amount, recipient, }) => (addressProvider) => {
    const aTerra = addressProvider.aTerra(currency);
    return [
        new terra_js_1.MsgExecuteContract(address, aTerra, {
            transfer: {
                recipient: accAddress(recipient),
                amount: new terra_js_1.Int(new terra_js_1.Dec(dec(amount)).mul(1000000)).toString(),
            },
        }),
    ];
};
exports.fabricateCw20Transfer = fabricateCw20Transfer;
