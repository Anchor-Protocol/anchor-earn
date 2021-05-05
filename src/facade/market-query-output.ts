import { JSONSerializable } from '../utils/json';

export interface MarketEntry {
  currency: string;
  liquidity: string;
  APY: string;
}

export class MarketOutput extends JSONSerializable<MarketOutput.Data> {
  network: string;
  height: number;
  timestamp: Date;
  markets: MarketEntry[];

  constructor(network: string, height: number, markets: MarketEntry[]) {
    super();
    this.network = network;
    this.height = height;
    this.markets = markets;
    this.timestamp = new Date();
  }

  public toData(): MarketOutput.Data {
    return {
      network: this.network,
      height: this.height,
      timestamp: this.timestamp,
      markets: this.markets,
    };
  }
}

export namespace MarketOutput {
  export interface Data {
    network: string;
    height: number;
    timestamp: Date;
    markets: MarketEntry[];
  }
}
