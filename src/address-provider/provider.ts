export interface AddressProvider {
  market(denom: DENOMS): string;

  overseer(denom: DENOMS): string;

  aTerra(denom: DENOMS): string;
}

export enum DENOMS {
  UUST = 'uusd',
  UKRW = 'ukrw',
  UANC = 'uanc',
  UAUST = 'uaust',
}
