import { Msg } from '@terra-money/terra.js';
import { AddressProvider } from '../address-provider';

export type OptionType<T> = T extends Fabricator<infer Option>
  ? OmitAddress<Option>
  : null;
export type Fabricator<T> = (
  option: T,
) => (addressProvider: AddressProvider) => Msg[];
export type OmitAddress<T> = Omit<T, 'address'>;

export interface Balance {
  balance: string;
}
