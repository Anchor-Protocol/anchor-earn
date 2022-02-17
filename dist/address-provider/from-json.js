"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressProviderFromJson = void 0;
const provider_1 = require("./provider");
class AddressProviderFromJson {
    constructor(data) {
        this.data = data;
    }
    market() {
        return this.data.mmMarket;
    }
    overseer() {
        return this.data.mmOverseer;
    }
    aTerra(denom) {
        if (denom == provider_1.DENOMS.UST) {
            return this.data.aTerra;
        }
        return '';
    }
}
exports.AddressProviderFromJson = AddressProviderFromJson;
