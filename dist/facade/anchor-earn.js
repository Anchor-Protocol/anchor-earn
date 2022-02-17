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
exports.AnchorEarn = void 0;
const facade_1 = require("../facade");
/**
 * @param {CHAINS} The blockchain that user wants to execute his message in.
 * @param {NETWORKS} the chain networks: It Could be either NETWORKS.BOMBAY_12 and NETWORKS.COLUMBUS_5.
 * The default network is NETWORKS.COLUMBUS_5.
 * @param {privateKey} chain account private key.
 * @param {mnemonic} list of words that is used to retrieve private key.
 * @param {address}: Client’s Terra address. It can be only used for queries.
 *
 * @example
 * const anchorEarn = new AnchorEarn({
      network: NETWORKS.BOMBAY_12,
      private_key: '....',
    });
 */
class AnchorEarn {
    constructor(options) {
        switch (options.chain) {
            case facade_1.CHAINS.TERRA: {
                this.earn = new facade_1.TerraAnchorEarn({
                    network: options.network,
                    privateKey: options.privateKey,
                    mnemonic: options.mnemonic,
                    address: options.address,
                });
            }
        }
    }
    balance(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.earn.balance(options);
        });
    }
    deposit(depositOption) {
        return this.earn.deposit(depositOption);
    }
    market(options) {
        return this.earn.market(options);
    }
    send(options) {
        return this.earn.send(options);
    }
    withdraw(withdrawOption) {
        return this.earn.withdraw(withdrawOption);
    }
}
exports.AnchorEarn = AnchorEarn;
