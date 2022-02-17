/// <reference types="node" />
import { AccAddress, Coins, Dec, Int, TxLog } from '@terra-money/terra.js';
import { DENOMS } from '../address-provider';
import { OperationType } from '../facade/types';
export declare const TERRA = "TERRA_";
export declare const UST = "UST";
export declare const aUST = "aUST";
export declare namespace Parse {
    function accAddress(input?: string): AccAddress;
    function int(input?: string): number;
    function uint128(input?: string): Int;
    function coins(input?: string): Coins;
    function dec(input?: string): Dec;
    function privateKey(input?: string): Buffer;
    function assertMarket(input?: DENOMS): boolean;
    function getMicroAmount(input?: string): Int;
    function getNaturalDecimals(input?: string): string;
    function subNaturalDecimals(minuend: string, subtrahend: string): string;
    function getPrivateKey(input?: string): string;
    function generateTerraAccessToken(input?: Buffer): string;
    function mapCurrencyToUST(input?: string): string;
    function mapCurrencyToUSD(input?: string): string;
    function mapCoinToUST(input?: Coins): string;
    function processLog(txLogs: TxLog[], type: OperationType): [string, string];
}
