"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceOutput = void 0;
const json_1 = require("../utils/json");
class BalanceOutput extends json_1.JSONSerializable {
    constructor(chain, network, height, address, balances, total_account_balance_in_ust, total_deposit_balance_in_ust) {
        super();
        this.chain = chain;
        this.network = network;
        this.height = height;
        this.address = address;
        this.balances = balances;
        this.timestamp = new Date();
        this.total_account_balance_in_ust = total_account_balance_in_ust;
        this.total_deposit_balance_in_ust = total_deposit_balance_in_ust;
    }
    toData() {
        return {
            chain: this.chain,
            network: this.network,
            height: this.height,
            timestamp: this.timestamp,
            address: this.address,
            balances: this.balances,
            total_account_balance_in_ust: this.total_account_balance_in_ust,
            total_deposit_balance_in_ust: this.total_deposit_balance_in_ust,
        };
    }
}
exports.BalanceOutput = BalanceOutput;
