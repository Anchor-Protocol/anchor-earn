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
exports.queryMarketEpochState = void 0;
/**
 * @param lcd to connect to terra chain.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 * @param block_height
 */
const queryMarketEpochState = ({ lcd, market, block_height, }) => (addressProvider) => __awaiter(void 0, void 0, void 0, function* () {
    const marketContractAddress = addressProvider.market(market);
    const response = yield lcd.wasm.contractQuery(marketContractAddress, {
        epoch_state: {
            block_height: block_height,
        },
    });
    return response;
});
exports.queryMarketEpochState = queryMarketEpochState;
