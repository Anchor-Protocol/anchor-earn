import { Msg } from '@terra-money/terra.js';
import { AddressProvider } from '../address-provider';
export declare type OptionType<T> = T extends Fabricator<infer Option> ? OmitAddress<Option> : null;
export declare type Fabricator<T> = (option: T) => (addressProvider: AddressProvider) => Msg[];
export declare type OmitAddress<T> = Omit<T, 'address'>;
export interface Balance {
    balance: string;
}
