import { LCDClient } from '@terra-money/terra.js';
import { AddressProvider, DENOMS } from '../address-provider';

interface Option {
  lcd: LCDClient;
  market: DENOMS;
}
interface EpochStateResponse {
  deposit_rate: string;
  prev_aterra_supply: string;
  prev_exchange_rate: string;
  last_executed_height: number;
}

/**
 * @param lcd to connect to terra chain.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 */
export const queryOverseerEpochState = ({ lcd, market }: Option) => async (
  addressProvider: AddressProvider,
): Promise<EpochStateResponse> => {
  const overseerContractAddress = addressProvider.overseer(market);
  const response: EpochStateResponse = await lcd.wasm.contractQuery(
    overseerContractAddress,
    {
      epoch_state: {},
    },
  );
  return response;
};
