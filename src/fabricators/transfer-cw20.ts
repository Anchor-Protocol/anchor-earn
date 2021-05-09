import { Dec, Int, MsgExecuteContract } from '@terra-money/terra.js';
import { Parse } from '../utils';
import accAddress = Parse.accAddress;
import dec = Parse.dec;

interface Option {
  address: string;
  contract_address: string;
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
  contract_address,
  amount,
  recipient,
}: Option): MsgExecuteContract[] => {
  return [
    new MsgExecuteContract(address, contract_address, {
      transfer: {
        recipient: accAddress(recipient),
        amount: new Int(new Dec(dec(amount)).mul(1000000)).toString(),
      },
    }),
  ];
};
