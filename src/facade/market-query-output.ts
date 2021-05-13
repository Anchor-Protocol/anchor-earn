import { JSONSerializable } from '../utils/json';
import { CHAINS } from './output';

export interface MarketEntry {
  currency: string;
  liquidity: string;
  APY: string;
}

export class MarketOutput extends JSONSerializable<MarketOutput.Data> {
  chain: CHAINS;
  network: string;
  height: number;
  timestamp: Date;
  markets: MarketEntry[];

  constructor(
    chain: CHAINS,
    network: string,
    height: number,
    markets: MarketEntry[],
  ) {
    super();
    this.chain = chain;
    this.network = network;
    this.height = height;
    this.markets = markets;
    this.timestamp = new Date();
  }

  public toData(): MarketOutput.Data {
    return {
      chain: this.chain,
      network: this.network,
      height: this.height,
      timestamp: this.timestamp,
      markets: this.markets,
    };
  }
}

export namespace MarketOutput {
  export interface Data {
    chain: CHAINS;
    network: string;
    height: number;
    timestamp: Date;
    markets: MarketEntry[];
  }
}
