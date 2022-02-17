"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testnetDefaultConfig = {
    lcd: {
        URL: 'https://bombay-lcd.terra.dev',
        chainID: 'bombay-12',
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
exports.default = testnetDefaultConfig;
