"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORKS = exports.CHAINS = exports.STATUS = exports.TxType = void 0;
/// TxType are send, withdraw and deposit.
/// SENDAUST usage is only for processing logs.
var TxType;
(function (TxType) {
    TxType["SEND"] = "send";
    TxType["DEPOSIT"] = "deposit";
    TxType["WITHDRAW"] = "withdraw";
})(TxType = exports.TxType || (exports.TxType = {}));
var STATUS;
(function (STATUS) {
    STATUS["SUCCESSFUL"] = "successful";
    STATUS["UNSUCCESSFUL"] = "unsuccessful";
    STATUS["IN_PROGRESS"] = "in-progress";
})(STATUS = exports.STATUS || (exports.STATUS = {}));
var CHAINS;
(function (CHAINS) {
    CHAINS["TERRA"] = "terra";
})(CHAINS = exports.CHAINS || (exports.CHAINS = {}));
var NETWORKS;
(function (NETWORKS) {
    NETWORKS[NETWORKS["COLUMBUS_5"] = 0] = "COLUMBUS_5";
    NETWORKS[NETWORKS["BOMBAY_12"] = 1] = "BOMBAY_12";
})(NETWORKS = exports.NETWORKS || (exports.NETWORKS = {}));
