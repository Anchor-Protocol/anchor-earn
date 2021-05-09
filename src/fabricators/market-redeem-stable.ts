import { Dec, Int, MsgExecuteContract } from '@terra-money/terra.js';
import { createHookMsg } from '../utils/create-hook-msg';
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
 * @param address Client’s Terra address.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 * @param amount Amount of a stablecoin to redeem, or amount of an aToken (aTerra) to redeem (specified by currency).
 */
export const fabricateMarketRedeemStable = ({
  address,
  currency,
  amount,
}: Option) => (addressProvider: AddressProvider): MsgExecuteContract[] => {
  const marketAddress = addressProvider.market(currency);
  const aTokenAddress = addressProvider.aTerra(currency);

  return [
    new MsgExecuteContract(accAddress(address), aTokenAddress, {
      send: {
        contract: marketAddress,
        amount: new Int(new Dec(dec(amount)).mul(1000000)).toString(),
        msg: createHookMsg({
          redeem_stable: {},
        }),
      },
    }),
  ];
};
