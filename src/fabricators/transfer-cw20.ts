import { Dec, Int, MsgExecuteContract } from '@terra-money/terra.js';
import { Parse } from '../utils';
import accAddress = Parse.accAddress;
import dec = Parse.dec;
import { AddressProvider, DENOMS } from '../address-provider';

interface Option {
  address: string;
  currency: DENOMS;
  amount: string;
  recipient: string;
}

/**
 * @param address Client’s Terra address.
 * @param contract_address: cw20 token contract address.
 * @param amount Amount of a stablecoin to deposit.
 * @param recipient: Client’s Terra address.
 */
export const fabricateCw20Transfer = ({
  address,
  currency,
  amount,
  recipient,
}: Option) => (addressProvider: AddressProvider): MsgExecuteContract[] => {
  const aTerra = addressProvider.aTerra(currency);
  return [
    new MsgExecuteContract(address, aTerra, {
      transfer: {
        recipient: accAddress(recipient),
        amount: new Int(new Dec(dec(amount)).mul(1000000)).toString(),
      },
    }),
  ];
};
