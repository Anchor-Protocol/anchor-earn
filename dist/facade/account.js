"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MnemonicKey = exports.Wallet = exports.Account = void 0;
const terra_js_1 = require("@terra-money/terra.js");
Object.defineProperty(exports, "MnemonicKey", { enumerable: true, get: function () { return terra_js_1.MnemonicKey; } });
Object.defineProperty(exports, "Wallet", { enumerable: true, get: function () { return terra_js_1.Wallet; } });
const json_1 = require("../utils/json");
const output_1 = require("./output");
//TODO: use an interface for Account
class Account extends json_1.JSONSerializable {
    constructor(chain) {
        super();
        switch (chain) {
            case output_1.CHAINS.TERRA: {
                const account = new terra_js_1.MnemonicKey();
                this.accAddress = account.accAddress;
                this.publicKey = account.publicKey;
                this.privateKey = account.privateKey;
                this.mnemonic = account.mnemonic;
            }
        }
    }
    toData() {
        return {
            acc_address: this.accAddress.toString(),
            public_key: this.publicKey.toString(),
            private_key: this.privateKey,
            mnemonic: this.mnemonic,
        };
    }
    get_private_key() {
        return this.privateKey;
    }
}
exports.Account = Account;
