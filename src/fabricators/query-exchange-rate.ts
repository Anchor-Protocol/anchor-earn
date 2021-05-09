import { LCDClient } from '@terra-money/terra.js';
import { AddressProvider, DENOMS } from '../address-provider';

interface Option {
  lcd: LCDClient;
  market: DENOMS;
  block_height?: number;
}
interface EpochStateResponse {
  exchange_rate: string;
  aterra_supply: string;
}

/**
 * @param lcd to connect to terra chain.
 * @param money currency currency. for now, DENOMS.USSD is supported.
 * @param block_height
 */
export const queryMarketEpochState = ({
  lcd,
  market,
  block_height,
}: Option) => async (
  addressProvider: AddressProvider,
): Promise<EpochStateResponse> => {
  const marketContractAddress = addressProvider.market(market);
  const response: EpochStateResponse = await lcd.wasm.contractQuery(
    marketContractAddress,
    {
      epoch_state: {
        block_height: block_height,
      },
    },
  );
  return response;
};
