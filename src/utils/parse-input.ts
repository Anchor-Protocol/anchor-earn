import {
  AccAddress,
  Coin,
  Coins,
  Dec,
  Int,
  TxLog,
} from '@terra-money/terra.js';
import { DENOMS } from '../address-provider';
import { TxType } from '../facade/types';

export const TERRA = 'TERRA_';
export const UST = 'UST';
export const aUST = 'aUST';

export namespace Parse {
  export function accAddress(input?: string): AccAddress {
    if (input === undefined) return undefined;

    if (!AccAddress.validate(input)) {
      throw new Error(`Invalid Terra account address: ${input}`);
    }

    return input;
  }

  export function int(input?: string): number {
    if (input === undefined) {
      return undefined;
    }
    return Number.parseInt(input);
  }

  export function uint128(input?: string): Int {
    if (input === undefined) {
      return undefined;
    }
    return new Int(input);
  }

  export function coins(input?: string): Coins {
    if (input === undefined) {
      return undefined;
    }
    return Coins.fromString(input);
  }

  export function dec(input?: string): Dec {
    if (input === undefined) {
      return undefined;
    }
    return new Dec(input);
  }

  export function privateKey(input?: string): Buffer {
    if (input === undefined) {
      return undefined;
    }
    return Buffer.from(input, 'base64');
  }

  export function assertMarket(input?: DENOMS): boolean {
    if (input !== DENOMS.UUST) {
      return false;
    }
    return true;
  }

  export function getNaturalDecimals(input?: string): string {
    return (+new Int(input).toString() / 1000000).toString();
  }

  export function getAccessToken(input?: string): string {
    if (!input.includes(TERRA)) {
      throw new Error('Access token is not correct');
    }
    return input.split('_')[1];
  }

  export function generateTerraAccessToken(input?: Buffer): string {
    return TERRA.concat(input.toString('base64')).toString();
  }

  export function mapCurrencyToUST(input?: string): string {
    if (input && input === 'uusd') {
      return 'uust';
    }
    return input;
  }

  export function mapCurrencyToUSD(input?: string): string {
    if (input && input === 'uust') {
      return 'uusd';
    }
    return input;
  }

  export function processLog(txLogs: TxLog[], type: TxType): [string, string] {
    let result;
    switch (type) {
      case TxType.DEPOSIT: {
        txLogs[0].events.forEach((e) => {
          if (e.type === 'transfer') {
            e.attributes.forEach((k) => {
              if (k.key === 'amount') {
                const coin = Coin.fromString(k.value);
                result = [getNaturalDecimals(coin.amount.toString()), UST];
              }
            });
          }
        });
        break;
      }
      case TxType.WITHDRAW: {
        txLogs[0].events.forEach((e) => {
          if (e.type === 'transfer') {
            e.attributes.forEach((k) => {
              if (k.key === 'amount') {
                const coin = Coin.fromString(k.value);
                result = [getNaturalDecimals(coin.amount.toString()), UST];
              }
            });
          }
        });
        break;
      }
      case TxType.SEND: {
        txLogs[0].events.forEach((e) => {
          if (e.type === 'transfer') {
            e.attributes.forEach((k) => {
              if (k.key === 'amount') {
                const coin = Coin.fromString(k.value);
                result = [getNaturalDecimals(coin.amount.toString()), UST];
              }
            });
          }
        });
        break;
      }
      case TxType.SENDAUST: {
        txLogs[0].events.forEach((e) => {
          if (e.type === 'from_contract') {
            e.attributes.forEach((k) => {
              if (k.key === 'amount') {
                result = [k.value, aUST];
              }
            });
          }
        });
        break;
      }
    }
    return result;
  }
}
