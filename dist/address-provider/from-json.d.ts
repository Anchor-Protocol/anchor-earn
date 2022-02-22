import { AddressProvider, DENOMS } from './provider';
export interface AddressMap {
    mmMarket: string;
    mmOverseer: string;
    aTerra: string;
}
export declare type AllowedAddressKeys = keyof AddressMap;
export declare class AddressProviderFromJson implements AddressProvider {
    private data;
    constructor(data: AddressMap);
    market(): string;
    overseer(): string;
    aTerra(denom: DENOMS): string;
}
