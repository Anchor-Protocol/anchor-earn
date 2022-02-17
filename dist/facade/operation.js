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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAndSignMsg = exports.createNativeSend = exports.sendSignedTransaction = exports.OperationImpl = void 0;
const terra_js_1 = require("@terra-money/terra.js");
const utils_1 = require("../utils");
var accAddress = utils_1.Parse.accAddress;
class OperationImpl {
    constructor(fabricator, option, addressProvider) {
        this._fabricator = fabricator;
        this._option = option;
        this._addressProvider = addressProvider;
    }
    generateWithAddress(address) {
        return this._fabricator(Object.assign({ address }, this._option))(this._addressProvider);
    }
    generateWithWallet(wallet) {
        return this.generateWithAddress(wallet.key.accAddress);
    }
    creatTx(wallet, { fee, gasPrices, gasAdjustment }) {
        return __awaiter(this, void 0, void 0, function* () {
            return wallet.createAndSignTx({
                fee,
                gasAdjustment,
                gasPrices,
                msgs: this._fabricator(Object.assign({ address: wallet.key.accAddress }, this._option))(this._addressProvider),
            });
        });
    }
    execute(wallet, { fee, gasPrices, gasAdjustment }) {
        return __awaiter(this, void 0, void 0, function* () {
            return wallet
                .createAndSignTx({
                fee,
                gasAdjustment,
                gasPrices,
                msgs: this._fabricator(Object.assign({ address: wallet.key.accAddress }, this._option))(this._addressProvider),
            })
                .then((tx) => {
                return wallet.lcd.tx.broadcast(tx);
            });
        });
    }
}
exports.OperationImpl = OperationImpl;
function sendSignedTransaction(lcd, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield lcd.tx.broadcastSync(tx);
    });
}
exports.sendSignedTransaction = sendSignedTransaction;
function createNativeSend(sender, options) {
    return new terra_js_1.MsgSend(sender, accAddress(options.recipient), [options.coin]);
}
exports.createNativeSend = createNativeSend;
function createAndSignMsg(wallet, { fee, gasPrices, gasAdjustment }, msgs) {
    return wallet.createAndSignTx({
        fee,
        gasAdjustment,
        gasPrices,
        msgs: msgs,
    });
}
exports.createAndSignMsg = createAndSignMsg;
