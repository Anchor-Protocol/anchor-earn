export interface AddressProvider {
    market(denom: DENOMS): string;
    overseer(denom: DENOMS): string;
    aTerra(denom: DENOMS): string;
}
export declare enum DENOMS {
    UST = "uusd",
    AUST = "uaust"
}
