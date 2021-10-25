import { AnchorConfig } from '../address-provider/types';

const mainnetDefaultConfig: AnchorConfig = {
  lcd: {
    URL: 'https://lcd.terra.dev',
    chainID: 'columbus-5',
    gasPrices: {
      uusd: 0.456,
    },
    gasAdjustment: 2,
  },
  contracts: {
    mmMarket: 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s',
    aTerra: 'terra1hzh9vpxhsk8253se0vv5jj6etdvxu3nv8z07zu',
    mmOverseer: 'terra1tmnqgvg567ypvsvk6rwsga3srp7e3lg6u0elp8',
  },
};

export default mainnetDefaultConfig;
