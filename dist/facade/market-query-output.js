"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketOutput = void 0;
const json_1 = require("../utils/json");
class MarketOutput extends json_1.JSONSerializable {
    constructor(chain, network, height, markets) {
        super();
        this.chain = chain;
        this.network = network;
        this.height = height;
        this.markets = markets;
        this.timestamp = new Date();
    }
    toData() {
        return {
            chain: this.chain,
            network: this.network,
            height: this.height,
            timestamp: this.timestamp,
            markets: this.markets,
        };
    }
}
exports.MarketOutput = MarketOutput;
