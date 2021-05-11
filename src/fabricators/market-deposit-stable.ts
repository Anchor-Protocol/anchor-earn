import { Dec, Int, MsgExecuteContract } from '@terra-money/terra.js';
import { AddressProvider } from '../address-provider';
import { DENOMS } from '../address-provider';
import { Parse } from '../utils';
import accAddress = Parse.accAddress;
import dec = Parse.dec;

interface Option {
  address: string;
  currency: DENOMS;
  amount: string;
}

/**
 *
 * @param address Client’s Terra address.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 * @param amount Amount of a stablecoin to deposit.
 */
export const fabricateMarketDepositStableCoin = ({
  address,
  currency,
  amount,
}: Option) => (addressProvider: AddressProvider): MsgExecuteContract[] => {
  const mmContractAddress = addressProvider.market(currency);

  return [
    new MsgExecuteContract(
      accAddress(address),
      mmContractAddress,
      {
        deposit_stable: {},
      },

      // coins
      {
        [`${currency}`]: new Int(new Dec(dec(amount)).mul(1000000)).toString(),
      },
    ),
  ];
};
