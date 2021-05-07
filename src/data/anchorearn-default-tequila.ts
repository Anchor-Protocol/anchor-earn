import { AnchorConfig } from '../address-provider/types';

const tequilaDefaultConfig: AnchorConfig = {
  lcd: {
    URL: 'https://tequila-lcd.terra.dev',
    chainID: 'tequila-0004',
    gasPrices: {
      uusd: 0.15,
    },
    gasAdjustment: 2,
  },
  contracts: {
    mmMarket: 'terra15dwd5mj8v59wpj0wvt233mf5efdff808c5tkal',
    mmOverseer: 'terra1qljxd0y3j3gk97025qvl3lgq8ygup4gsksvaxv',
    aTerra: 'terra1ajt556dpzvjwl0kl5tzku3fc3p3knkg9mkv8jl',
  },
};

export default tequilaDefaultConfig;
