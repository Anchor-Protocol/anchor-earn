import { BlockTxBroadcastResult, Dec, isTxError } from '@terra-money/terra.js';
import { OperationType } from './types';
import { Parse } from '../utils';
import { JSONSerializable } from '../utils/json';
import { CHAINS, Output, STATUS, TxDetails, TxType } from './output';
import getNaturalDecimals = Parse.getNaturalDecimals;
import processLog = Parse.processLog;
import subNaturalDecimals = Parse.subNaturalDecimals;
import { TxInfo } from '@terra-money/terra.js';

const DEFAULT_DEDUCTED_TAX = '0';

export interface OperationError {
  type: TxType;
  network: string;
  chain: CHAINS;
  status: STATUS;
  error_msg: string;
}

export class TxOutput
  extends JSONSerializable<TxOutput.Data>
  implements Output {
  chain: string;
  network: string;
  status: STATUS;
  type: TxType;
  currency: string;
  amount: string;
  txDetails: TxDetails[];
  txFee: string;
  deductedTax?: string;

  constructor(
    txResult: TxInfo,
    type: OperationType,
    chain: string,
    network: string,
    taxFee: string,
    gasPrice: number,
    requestedAmount?: string,
  ) {
    super();
    this.type = getTxType(type);
    this.network = network;
    this.chain = chain;
    if (isTxError(txResult)) {
      this.status = STATUS.UNSUCCESSFUL;
    } else {
      this.status = STATUS.SUCCESSFUL;
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

  public toData(): TxOutput.Data {
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

export namespace TxOutput {
  export interface Data {
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

function computeTax(
  gasPrice: number,
  gasWanted: number,
  taxFee: string,
): string {
  return getNaturalDecimals(
    new Dec(taxFee)
      .mul(1000000)
      .add(gasPrice * gasWanted + 1)
      .toString(),
  ).concat(' UST');
}

export function getTxType(type: OperationType): TxType {
  switch (type) {
    case OperationType.DEPOSIT: {
      return TxType.DEPOSIT;
    }
    case OperationType.SEND: {
      return TxType.SEND;
    }
    case OperationType.SENDAUST: {
      return TxType.SEND;
    }
    case OperationType.WITHDRAW: {
      return TxType.WITHDRAW;
    }
  }
}
