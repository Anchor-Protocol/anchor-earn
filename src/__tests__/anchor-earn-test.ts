import {
  AnchorEarn,
  CHAINS,
  MnemonicKey,
  NETWORKS,
  OutputImpl,
  Wallet,
} from '../facade';
import { LCDClient, Msg } from '@terra-money/terra.js';
import { DENOMS } from '../address-provider';

//accounts were created for test purposes and they have 5000ust and 5000aust.

describe('anchor-earn', () => {
  it('deposit', async () => {
    //address: terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u
    const account = new MnemonicKey({
      mnemonic:
        'kidney cannon silk dust tube flight trophy approve identify kind purse install proud kind pigeon bleak this clever mosquito change cash mango sample prepare',
    });

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
      privateKey: account.privateKey,
    });

    const deposit = await anchorEarn.earn.deposit({
      amount: '0.01',
      currency: DENOMS.UST,
    });

    if (deposit instanceof OutputImpl) {
      console.log(deposit.toData());
    }
  });

  it('failed-deposit', () => {
    //address: terra1pgtqe0qv9gl77hnwwvwmsjywlucgz25ywm8a22
    const account = new MnemonicKey({
      mnemonic:
        'spider clerk bird usual rug meadow evoke deny search art seven notable cousin quote april grace reward author climb soccer couple physical calm equip',
    });

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
      privateKey: account.privateKey,
    });
    anchorEarn.earn
      .deposit({
        amount: '10000000',
        currency: DENOMS.UST,
      })
      .catch((e: Error) => {
        expect(e.message).toEqual('Insufficient ust balance');
      });
  });

  it('deposit-customized-sign', async () => {
    //address: terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
    });
    const deposit = await anchorEarn.earn.deposit({
      amount: '0.01',
      currency: DENOMS.UST,
      log: (data) => {
        console.log(data);
      },
      customSigner: async (tx: Msg[]) => {
        const account = new MnemonicKey({
          mnemonic:
            'kidney cannon silk dust tube flight trophy approve identify kind purse install proud kind pigeon bleak this clever mosquito change cash mango sample prepare',
        });

        const wallet = new Wallet(
          new LCDClient({
            URL: 'https://tequila-lcd.terra.dev',
            chainID: 'tequila-0004',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
      address: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
    });

    if (deposit instanceof OutputImpl) {
      console.log(deposit.toData());
    }

    // signer is different from the address
    // signer is terra1chxrckyqauguv268kg0vjp9qrzefv8vff392x6
    await anchorEarn.earn.deposit({
      amount: '0.01',
      currency: DENOMS.UST,
      log: (data) => {
        console.log(data);
      },
      customSigner: async (tx: Msg[]) => {
        const account = new MnemonicKey({
          mnemonic:
            'twice monitor exact gaze ugly spread taste prefer system latin remain swarm pause rubber lens jump young sheriff float fish second royal talk have',
        });

        const wallet = new Wallet(
          new LCDClient({
            URL: 'https://tequila-lcd.terra.dev',
            chainID: 'tequila-0004',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
      address: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
    });

    await anchorEarn.earn
      .deposit({
        amount: '0.01',
        currency: DENOMS.UST,
        log: (data) => {
          console.log(data);
        },
        customSigner: async (tx: Msg[]) => {
          const account = new MnemonicKey({
            mnemonic:
              'kidney cannon silk dust tube flight trophy approve identify kind purse install proud kind pigeon bleak this clever mosquito change cash mango sample prepare',
          });

          const wallet = new Wallet(
            new LCDClient({
              URL: 'https://tequila-lcd.terra.dev',
              chainID: 'tequila-0004',
            }),
            account,
          );

          return await wallet.createAndSignTx({
            msgs: tx,
            gasAdjustment: 2,
            gasPrices: { uusd: 0.15 },
          });
        },
        address: 'invalid address',
      })
      .catch((e: Error) =>
        expect(e.message).toContain('Invalid Terra account address:'),
      );

    anchorEarn.earn
      .deposit({
        amount: '0.01',
        currency: DENOMS.UST,
        log: (data) => {
          console.log(data);
        },
        customSigner: async (tx: Msg[]) => {
          const account = new MnemonicKey({
            mnemonic:
              'kidney cannon silk dust tube flight trophy approve identify kind purse install proud kind pigeon bleak this clever mosquito change cash mango sample prepare',
          });

          const wallet = new Wallet(
            new LCDClient({
              URL: 'https://tequila-lcd.terra.dev',
              chainID: 'tequila-0004',
            }),
            account,
          );

          return await wallet.createAndSignTx({
            msgs: tx,
            gasAdjustment: 2,
            gasPrices: { uusd: 0.15 },
          });
        },
      })
      .catch((e: Error) =>
        expect(e.message).toEqual('Address must be provided'),
      );

    anchorEarn.earn
      .deposit({
        amount: '0.01',
        currency: DENOMS.UST,
        log: (data) => {
          console.log(data);
        },
        address: 'some address',
      })
      .catch((e: Error) =>
        expect(e.message).toContain('Address must be used with customSigner'),
      );

    anchorEarn.earn
      .deposit({
        amount: '0.01',
        currency: DENOMS.UST,
        log: (data) => {
          console.log(data);
        },
        address: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      })
      .catch((e: Error) =>
        expect(e.message).toContain('Address must be used with customSigner'),
      );
  });

  it('send-aust', async () => {
    //address: terra1grng2qchtur284ylk6g5xplnutjg6smnwlwrhj
    const account = new MnemonicKey({
      mnemonic:
        'supply sting ranch post eternal decline silly want outside prize crazy rapid foil gain soft above left castle illness cargo night game satisfy legend',
    });
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
      privateKey: account.privateKey,
    });
    const sendAust = await anchorEarn.earn.send({
      currency: DENOMS.AUST,
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
    });

    if (sendAust instanceof OutputImpl) {
      console.log(sendAust.toData());
    }
  });

  it('send-aust-custom-signer', async () => {
    //address: terra1u6pnfv06dc62d35g8halz59xw3tt7l60dp4sdt
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
    });
    await anchorEarn.earn.send({
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
      currency: DENOMS.AUST,
      log: (data) => {
        console.log(data);
      },
      customSigner: async (tx: Msg[]) => {
        const account = new MnemonicKey({
          mnemonic:
            'frozen nation brand marriage tuition return symbol creek father forward invite invite eternal debris solve popular life decorate effort ranch wrist galaxy rich guilt',
        });

        const wallet = new Wallet(
          new LCDClient({
            URL: 'https://tequila-lcd.terra.dev',
            chainID: 'tequila-0004',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
      address: 'terra1u6pnfv06dc62d35g8halz59xw3tt7l60dp4sdt',
    });

    await anchorEarn.earn
      .send({
        recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
        amount: '0.01',
        currency: DENOMS.AUST,
        log: (data) => {
          console.log(data);
        },
        address: 'terra1u6pnfv06dc62d35g8halz59xw3tt7l60dp4sdt',
      })
      .catch((e: Error) =>
        expect(e.message).toEqual('Address must be used with customSigner'),
      );

    await anchorEarn.earn
      .send({
        recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
        amount: '0.01',
        currency: DENOMS.AUST,
        log: (data) => {
          console.log(data);
        },
        customSigner: async (tx: Msg[]) => {
          const account = new MnemonicKey({
            mnemonic:
              'frozen nation brand marriage tuition return symbol creek father forward invite invite eternal debris solve popular life decorate effort ranch wrist galaxy rich guilt',
          });

          const wallet = new Wallet(
            new LCDClient({
              URL: 'https://tequila-lcd.terra.dev',
              chainID: 'tequila-0004',
            }),
            account,
          );

          return await wallet.createAndSignTx({
            msgs: tx,
            gasAdjustment: 2,
            gasPrices: { uusd: 0.15 },
          });
        },
      })
      .catch((e: Error) =>
        expect(e.message).toEqual('Address must be provided'),
      );
  });

  it('send-ust', async () => {
    //address: terra1grng2qchtur284ylk6g5xplnutjg6smnwlwrhj
    const account = new MnemonicKey({
      mnemonic:
        'supply sting ranch post eternal decline silly want outside prize crazy rapid foil gain soft above left castle illness cargo night game satisfy legend',
    });
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
      privateKey: account.privateKey,
    });
    const sendUst = await anchorEarn.earn.send({
      currency: DENOMS.UST,
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
    });

    if (sendUst instanceof OutputImpl) {
      console.log(sendUst.toData());
    }
  });

  it('withdraw', async () => {
    //address: terra1grng2qchtur284ylk6g5xplnutjg6smnwlwrhj
    const account = new MnemonicKey({
      mnemonic:
        'supply sting ranch post eternal decline silly want outside prize crazy rapid foil gain soft above left castle illness cargo night game satisfy legend',
    });
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
      privateKey: account.privateKey,
    });
    const withdraw = await anchorEarn.earn.withdraw({
      amount: '0.01',
      currency: DENOMS.UST,
    });

    if (withdraw instanceof OutputImpl) {
      console.log(withdraw.toData());
    }
    expect(withdraw.type).toEqual('withdraw');

    //failure: account does not have deposit
    //address: terra1ypnfshpkyh8rzyh39unz0xsj3x8jd59hru8fwe
    const failure_account = new MnemonicKey({
      mnemonic:
        'scale forward black ten treat vibrant ribbon sleep beyond change cattle super argue enjoy nothing task always bitter slide ozone burger thank gentle borrow',
    });

    const failedAnchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
      privateKey: failure_account.privateKey,
    });

    failedAnchorEarn.earn
      .withdraw({
        amount: '1000000000000',
        currency: DENOMS.UST,
      })
      .catch((e: Error) => {
        expect(e.message).toEqual('There is no deposit for the user');
      });

    failedAnchorEarn.earn
      .withdraw({
        amount: '0',
        currency: DENOMS.UST,
      })
      .catch((e: Error) => {
        expect(e.message).toEqual('Invalid zero amount');
      });
  });

  it('withdraw-custom-sign', async () => {
    //address: terra10zkyac50dgx830uepym5508h7vukqufr6y5wdy

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
    });

    await anchorEarn.earn.withdraw({
      amount: '0.01',
      currency: DENOMS.UST,
      log: (data) => {
        console.log(data);
      },
      customSigner: async (tx: Msg[]) => {
        const account = new MnemonicKey({
          mnemonic:
            'duck east orange tonight canvas denial pudding ill vital thunder action survey teach horror add secret maze team young clarify enact repair mass team',
        });

        const wallet = new Wallet(
          new LCDClient({
            URL: 'https://tequila-lcd.terra.dev',
            chainID: 'tequila-0004',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
      address: 'terra10zkyac50dgx830uepym5508h7vukqufr6y5wdy',
    });

    // signer is different from the address
    // signer is terra1chxrckyqauguv268kg0vjp9qrzefv8vff392x6
    await anchorEarn.earn.withdraw({
      amount: '0.01',
      currency: DENOMS.UST,
      log: (data) => {
        console.log(data);
      },
      customSigner: async (tx: Msg[]) => {
        const account = new MnemonicKey({
          mnemonic:
            'twice monitor exact gaze ugly spread taste prefer system latin remain swarm pause rubber lens jump young sheriff float fish second royal talk have',
        });

        const wallet = new Wallet(
          new LCDClient({
            URL: 'https://tequila-lcd.terra.dev',
            chainID: 'tequila-0004',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
      address: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
    });

    await anchorEarn.earn
      .withdraw({
        amount: '0.01',
        currency: DENOMS.UST,
        log: (data) => {
          console.log(data);
        },
        address: 'terra10zkyac50dgx830uepym5508h7vukqufr6y5wdy',
      })
      .catch((e: Error) =>
        expect(e.message).toEqual('Address must be used with customSigner'),
      );

    await anchorEarn.earn
      .withdraw({
        amount: '0.01',
        currency: DENOMS.UST,
        log: (data) => {
          console.log(data);
        },
        customSigner: async (tx: Msg[]) => {
          const account = new MnemonicKey({
            mnemonic:
              'duck east orange tonight canvas denial pudding ill vital thunder action survey teach horror add secret maze team young clarify enact repair mass team',
          });

          const wallet = new Wallet(
            new LCDClient({
              URL: 'https://tequila-lcd.terra.dev',
              chainID: 'tequila-0004',
            }),
            account,
          );

          return await wallet.createAndSignTx({
            msgs: tx,
            gasAdjustment: 2,
            gasPrices: { uusd: 0.15 },
          });
        },
      })
      .catch((e: Error) =>
        expect(e.message).toEqual('Address must be provided'),
      );

    await anchorEarn.earn
      .withdraw({
        amount: '0.01',
        currency: DENOMS.UST,
        log: (data) => {
          console.log(data);
        },
        customSigner: async (tx: Msg[]) => {
          const account = new MnemonicKey({
            mnemonic:
              'duck east orange tonight canvas denial pudding ill vital thunder action survey teach horror add secret maze team young clarify enact repair mass team',
          });

          const wallet = new Wallet(
            new LCDClient({
              URL: 'https://tequila-lcd.terra.dev',
              chainID: 'tequila-0004',
            }),
            account,
          );

          return await wallet.createAndSignTx({
            msgs: tx,
            gasAdjustment: 2,
            gasPrices: { uusd: 0.15 },
          });
        },
        address: 'invalid address',
      })
      .catch((e: Error) =>
        expect(e.message).toContain('Invalid Terra account address:'),
      );
  });

  it('balance', async () => {
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
    });

    const userBalance = await anchorEarn.earn.balance({
      currencies: [DENOMS.UST],
      address: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
    });

    console.log(userBalance.toData());

    anchorEarn.earn
      .balance({
        currencies: [DENOMS.UST],
        address: 'invalid address',
      })
      .catch((e: Error) =>
        expect(e.message).toContain('Invalid Terra account address:'),
      );
  });

  it('market', async () => {
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.TESTNET,
    });

    const market = await anchorEarn.earn.market({
      currencies: [DENOMS.UST],
    });

    console.log(market.toData());
  });
});
