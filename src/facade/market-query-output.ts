import * as yaml from 'yaml';

export interface MarketEntry {
  currency: string;
  liquidity: string;
  APY: string;
}

export class MarketOutput {
  network: string;
  height: number;
  timestamp: Date;
  markets: MarketEntry[];

  constructor(network: string, height: number, markets: MarketEntry[]) {
    this.network = network;
    this.height = height;
    this.markets = markets;
    this.timestamp = new Date();
  }

  print(): void {
    console.log(yaml.stringify(this));
  }
}
