import { LCDClient } from '@terra-money/terra.js';
import { AddressProvider, DENOMS } from '../address-provider';
import { Balance } from './types';

interface Option {
  lcd: LCDClient;
  address: string;
  market: DENOMS;
}

/**
 * @param lcd to connect to terra chain
 * @param address Client’s Terra address.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 */

export const queryAUSTBalance = ({ lcd, address, market }: Option) => async (
  addressProvider: AddressProvider,
): Promise<Balance> => {
  if (addressProvider.aTerra(market) === '') {
    return { balance: '0' };
  }
  return lcd.wasm.contractQuery<Balance>(addressProvider.aTerra(market), {
    balance: {
      address: address,
    },
  });
};
