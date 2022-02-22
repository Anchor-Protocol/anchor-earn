import { JSONSerializable } from '../utils/json';
import { CHAINS } from './output';
export interface MarketEntry {
    currency: string;
    liquidity: string;
    APY: string;
}
export declare class MarketOutput extends JSONSerializable<MarketOutput.Data> {
    chain: CHAINS;
    network: string;
    height: number;
    timestamp: Date;
    markets: MarketEntry[];
    constructor(chain: CHAINS, network: string, height: number, markets: MarketEntry[]);
    toData(): MarketOutput.Data;
}
export declare namespace MarketOutput {
    interface Data {
        chain: CHAINS;
        network: string;
        height: number;
        timestamp: Date;
        markets: MarketEntry[];
    }
}
