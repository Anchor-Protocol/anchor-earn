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
exports.queryAUSTBalance = void 0;
/**
 * @param lcd to connect to terra chain
 * @param address Client’s Terra address.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 */
const queryAUSTBalance = ({ lcd, address, market }) => (addressProvider) => __awaiter(void 0, void 0, void 0, function* () {
    if (addressProvider.aTerra(market) === '') {
        return { balance: '0' };
    }
    return lcd.wasm.contractQuery(addressProvider.aTerra(market), {
        balance: {
            address: address,
        },
    });
});
exports.queryAUSTBalance = queryAUSTBalance;
