import { AddressProvider, DENOMS } from './provider';

export interface AddressMap {
  mmMarket: string;
  mmOverseer: string;
  aTerra: string;
}

export type AllowedAddressKeys = keyof AddressMap;

export class AddressProviderFromJson implements AddressProvider {
  constructor(private data: AddressMap) {}

  market(): string {
    return this.data.mmMarket;
  }

  overseer(): string {
    return this.data.mmOverseer;
  }

  aTerra(denom: DENOMS): string {
    if (denom == DENOMS.UST) {
      return this.data.aTerra;
    }
    return '';
  }
}
