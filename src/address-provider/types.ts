import { LCDClientConfig } from '@terra-money/terra.js';

export interface AnchorConfig {
  lcd: LCDClientConfig;
  contracts: Contracts;
}

export interface Contracts {
  mmMarket: string;
  mmOverseer: string;
  aTerra: string;
}
