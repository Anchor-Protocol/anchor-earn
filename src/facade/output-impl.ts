import { BlockTxBroadcastResult, Int, isTxError } from '@terra-money/terra.js';
import { CHAINS, Output, STATUS, TxType } from './types';
import { Parse } from '../utils/parse-input';
import { JSONSerializable } from '../utils/json';
import getNaturalDecimals = Parse.getNaturalDecimals;
import processLog = Parse.processLog;
import subNaturalDecimals = Parse.subNaturalDecimals;

export interface OperationError {
  type: TxType;
  chain: CHAINS;
  status: STATUS;
  error_msg: string;
}

export class OutputImpl
  extends JSONSerializable<OutputImp.Data>
  implements Output {
  chain: string;
  network: string;
  status: STATUS;
  txHash: string;
  height: number;
  timestamp: Date;
  type: TxType;
  currency: string;
  amount: string;
  txFee: string;
  deductedTax?: string;

  constructor(
    txResult: BlockTxBroadcastResult,
    type: TxType,
    chain: string,
    network: string,
    gasPrice: number,
    requestedAmount?: string,
  ) {
    super();
    this.type = type;
    this.network = network;
    this.chain = chain;

    if (isTxError(txResult)) {
      this.status = STATUS.UNSUCCESSFUL;
    } else {
      this.status = STATUS.SUCCESSFUL;
      this.height = txResult.height;
      this.txHash = txResult.txhash;
      this.timestamp = new Date();
      this.txFee = computeTax(gasPrice, txResult.gas_wanted);
      const processedLog = processLog(txResult.logs, type);
      this.amount = processedLog[0];
      this.currency = processedLog[1];
      this.deductedTax = requestedAmount
        ? subNaturalDecimals(requestedAmount, this.amount)
        : undefined;
    }
  }

  public toData(): OutputImp.Data {
    return {
      type: this.type,
      status: this.status,
      txHash: this.txHash,
      currency: this.currency,
      amount: this.amount,
      txFee: this.txFee,
      deductedTax: this.deductedTax ? this.deductedTax : '0',
      height: this.height,
      timestamp: this.timestamp.toString(),
      chain: this.chain,
      network: this.network,
    };
  }
}

export namespace OutputImp {
  export interface Data {
    type: string;
    status: string;
    txHash: string;
    currency: string;
    amount: string;
    txFee: string;
    deductedTax?: string;
    height: number;
    timestamp: string;
    chain: string;
    network: string;
  }
}

function computeTax(gasPrice: number, gasWanted: number): string {
  return getNaturalDecimals(new Int(gasPrice * gasWanted).toString()).concat(
    ' UST',
  );
}
