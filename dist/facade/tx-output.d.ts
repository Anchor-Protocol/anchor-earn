import { OperationType } from './types';
import { JSONSerializable } from '../utils/json';
import { CHAINS, Output, STATUS, TxDetails, TxType } from './output';
import { TxInfo } from '@terra-money/terra.js';
export interface OperationError {
    type: TxType;
    network: string;
    chain: CHAINS;
    status: STATUS;
    error_msg: string;
}
export declare class TxOutput extends JSONSerializable<TxOutput.Data> implements Output {
    chain: string;
    network: string;
    status: STATUS;
    type: TxType;
    currency: string;
    amount: string;
    txDetails: TxDetails[];
    txFee: string;
    deductedTax?: string;
    constructor(txResult: TxInfo, type: OperationType, chain: string, network: string, taxFee: string, gasPrice: number, requestedAmount?: string);
    toData(): TxOutput.Data;
}
export declare namespace TxOutput {
    interface Data {
        type: string;
        status: string;
        tx_details: TxDetails[];
        currency: string;
        amount: string;
        tx_fee: string;
        deducted_tax?: string;
        chain: string;
        network: string;
    }
}
export declare function getTxType(type: OperationType): TxType;
