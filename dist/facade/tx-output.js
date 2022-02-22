"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTxType = exports.TxOutput = void 0;
const terra_js_1 = require("@terra-money/terra.js");
const types_1 = require("./types");
const utils_1 = require("../utils");
const json_1 = require("../utils/json");
const output_1 = require("./output");
var getNaturalDecimals = utils_1.Parse.getNaturalDecimals;
var processLog = utils_1.Parse.processLog;
var subNaturalDecimals = utils_1.Parse.subNaturalDecimals;
const DEFAULT_DEDUCTED_TAX = '0';
class TxOutput extends json_1.JSONSerializable {
    constructor(txResult, type, chain, network, taxFee, gasPrice, requestedAmount) {
        super();
        this.type = getTxType(type);
        this.network = network;
        this.chain = chain;
        if ((0, terra_js_1.isTxError)(txResult)) {
            this.status = output_1.STATUS.UNSUCCESSFUL;
        }
        else {
            this.status = output_1.STATUS.SUCCESSFUL;
            this.txDetails = [
                {
                    chain: chain,
                    network: network,
                    height: txResult.height,
                    timestamp: new Date(),
                    txHash: txResult.txhash,
                },
            ];
            this.txFee = computeTax(gasPrice, txResult.gas_wanted, taxFee);
            const processedLog = processLog(txResult.logs, type);
            this.amount = processedLog[0];
            this.currency = processedLog[1];
            this.deductedTax = requestedAmount
                ? subNaturalDecimals(requestedAmount, this.amount)
                : DEFAULT_DEDUCTED_TAX;
        }
    }
    toData() {
        return {
            type: this.type,
            status: this.status,
            currency: this.currency,
            tx_details: this.txDetails,
            amount: this.amount,
            tx_fee: this.txFee,
            deducted_tax: this.deductedTax ? this.deductedTax : '0',
            chain: this.chain,
            network: this.network,
        };
    }
}
exports.TxOutput = TxOutput;
function computeTax(gasPrice, gasWanted, taxFee) {
    return getNaturalDecimals(new terra_js_1.Dec(taxFee)
        .mul(1000000)
        .add(gasPrice * gasWanted + 1)
        .toString()).concat(' UST');
}
function getTxType(type) {
    switch (type) {
        case types_1.OperationType.DEPOSIT: {
            return output_1.TxType.DEPOSIT;
        }
        case types_1.OperationType.SEND: {
            return output_1.TxType.SEND;
        }
        case types_1.OperationType.SENDAUST: {
            return output_1.TxType.SEND;
        }
        case types_1.OperationType.WITHDRAW: {
            return output_1.TxType.WITHDRAW;
        }
    }
}
exports.getTxType = getTxType;
