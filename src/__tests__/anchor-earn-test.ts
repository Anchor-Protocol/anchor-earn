import {
  AnchorEarn,
  CHAINS,
  MnemonicKey,
  NETWORKS,
  TxOutput,
  Wallet,
} from '../facade';
import { LCDClient, Msg } from '@terra-money/terra.js';
import { DENOMS } from '../address-provider';

//accounts were created for test purposes and they have 5000ust and 5000aust.

//TODO: Using macks for all lcd touches.

describe('anchor-earn', () => {
  it('deposit', async () => {
    //address: terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u
    const account = new MnemonicKey({
      mnemonic:
        'kidney cannon silk dust tube flight trophy approve identify kind purse install proud kind pigeon bleak this clever mosquito change cash mango sample prepare',
    });

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });

    const deposit = await anchorEarn.deposit({
      amount: '0.01',
      currency: DENOMS.UST,
    });

    if (deposit instanceof TxOutput) {
      console.log(deposit.toData());
    }
  });

  it('failed-deposit', async () => {
    //address: terra1arf9420dd8suu4a7cmw6wap5zfjt7wxaadrt74
    const account = new MnemonicKey({
      mnemonic:
        'canoe collect invest hurry cancel educate ask swarm sell topic raccoon first group session decline coral merit total icon warm check glow urban track',
    });

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });

    await anchorEarn
      .deposit({
        amount: '10000000',
        currency: DENOMS.UST,
      })
      .catch((e: Error) => {
        expect(e.message).toEqual('Insufficient ust balance');
      });

    //address: terra17jxhfjl9ty2xunz2cgv4cgy2ah4s8um4c6uwqt
    const account2 = new MnemonicKey({
      mnemonic:
        'guide cheap phone best option coffee tonight ocean exchange skull cement salad concert urban course drastic bright pool soap actual duck correct body tomorrow',
    });

    const anchorEarn2 = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account2.privateKey,
    });
    await anchorEarn2
      .deposit({
        amount: '10000000',
        currency: DENOMS.UST,
      })
      .catch((e: Error) => {
        expect(e.message).toContain('Insufficient ust balance');
      });
  });

  it('deposit-custom-signer', async () => {
    //address: terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      address: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
    });
    const deposit = await anchorEarn.deposit({
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
            URL: 'https://bombay-lcd.terra.dev',
            chainID: 'bombay-12',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
    });

    if (deposit instanceof TxOutput) {
      console.log(deposit.toData());
    }

    await anchorEarn
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
              URL: 'https://bombay-lcd.terra.dev',
              chainID: 'bombay-12',
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
        expect(e.message).toContain('Invalid Terra account address:'),
      );
  });

  it('deposit-custom-broadcast', async () => {
    //address: terra1cd8sj2dfmcjcujafwx59yuk2xd9j8e86c2pyva
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      address: 'terra1cd8sj2dfmcjcujafwx59yuk2xd9j8e86c2pyva',
    });

    await anchorEarn.deposit({
      amount: '0.01',
      currency: DENOMS.UST,
      log: (data) => {
        console.log(data);
      },
      customBroadcaster: async (tx: Msg[]) => {
        const account = new MnemonicKey({
          mnemonic:
            'pill pull give garage crunch glove gloom pitch attract fashion tomorrow orbit blame repair autumn check kitten hollow exit goose city daughter usage angle',
        });

        const wallet = new Wallet(
          new LCDClient({
            URL: 'https://bombay-lcd.terra.dev',
            chainID: 'bombay-12',
          }),
          account,
        );

        const signedTx = await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });

        return wallet.lcd.tx.broadcastSync(signedTx).then((result) => {
          return result.txhash;
        });
      },
    });
  });

  // test amount assertion
  it('deposit-assert-input-1', async () => {
    //address: terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u
    const account = new MnemonicKey({
      mnemonic:
        'kidney cannon silk dust tube flight trophy approve identify kind purse install proud kind pigeon bleak this clever mosquito change cash mango sample prepare',
    });

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });

    await anchorEarn
      .deposit({
        amount: 'invalid',
        currency: DENOMS.UST,
      })
      .catch((e: Error) => {
        expect(e.message).toContain('Invalid argument');
      });
  });

  it('send-aust', async () => {
    //address: terra1grng2qchtur284ylk6g5xplnutjg6smnwlwrhj
    const account = new MnemonicKey({
      mnemonic:
        'supply sting ranch post eternal decline silly want outside prize crazy rapid foil gain soft above left castle illness cargo night game satisfy legend',
    });
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });
    const sendAust = await anchorEarn.send({
      currency: DENOMS.AUST,
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
    });

    if (sendAust instanceof TxOutput) {
      console.log(sendAust.toData());
    }
  });

  it('send-aust-custom-signer', async () => {
    //address: terra1u6pnfv06dc62d35g8halz59xw3tt7l60dp4sdt
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      address: 'terra1u6pnfv06dc62d35g8halz59xw3tt7l60dp4sdt',
    });
    await anchorEarn.send({
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
            URL: 'https://bombay-lcd.terra.dev',
            chainID: 'bombay-12',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
    });
  });

  // test amount assertion
  it('send-aust-assert-input-1', () => {
    //address: terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u
    const account = new MnemonicKey({
      mnemonic:
        'kidney cannon silk dust tube flight trophy approve identify kind purse install proud kind pigeon bleak this clever mosquito change cash mango sample prepare',
    });

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });

    anchorEarn
      .send({
        recipient: 'terra1u6pnfv06dc62d35g8halz59xw3tt7l60dp4sdt',
        amount: 'invalid',
        currency: DENOMS.UST,
      })
      .catch((e: Error) => {
        expect(e.message).toContain('Invalid argument');
      });
  });

  // test input assertion except amount
  it('send-aust-assert-input', async () => {
    //address: terra1grng2qchtur284ylk6g5xplnutjg6smnwlwrhj
    const account = new MnemonicKey({
      mnemonic:
        'supply sting ranch post eternal decline silly want outside prize crazy rapid foil gain soft above left castle illness cargo night game satisfy legend',
    });

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });

    await anchorEarn
      .send({
        currency: DENOMS.AUST,
        recipient: 'invalid',
        amount: '0.01',
      })
      .catch((e: Error) =>
        expect(e.message).toContain('Invalid Terra account address'),
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
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });
    const sendUst = await anchorEarn.send({
      currency: DENOMS.UST,
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
    });

    if (sendUst instanceof TxOutput) {
      console.log(sendUst.toData());
    }
  });

  it('send-ust-custom-signer', async () => {
    //address: terra1jtuzr0k9765tjnmqxm4c2y2ufrld6htwgfznyn
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      address: 'terra1jtuzr0k9765tjnmqxm4c2y2ufrld6htwgfznyn',
    });
    await anchorEarn.send({
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
      currency: DENOMS.UST,
      log: (data) => {
        console.log(data);
      },
      customSigner: async (tx: Msg[]) => {
        const account = new MnemonicKey({
          mnemonic:
            'jungle asthma machine bring result credit wisdom dinosaur office book reopen ladder dune gadget choice insane festival inspire drive female speed evil wreck acid',
        });

        const wallet = new Wallet(
          new LCDClient({
            URL: 'https://bombay-lcd.terra.dev',
            chainID: 'bombay-12',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
    });
  });

  it('send-ust-custom-broadcast', async () => {
    //address: terra1tu97t4zkw2xrepplmphyfjnnf5grf54t7drsq5
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      mnemonic:
        'jungle asthma machine bring result credit wisdom dinosaur office book reopen ladder dune gadget choice insane festival inspire drive female speed evil wreck acid',
    });

    await anchorEarn.send({
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
      currency: DENOMS.UST,
      log: (data) => {
        console.log(data);
      },
      customBroadcaster: async (tx: Msg[]) => {
        const lcd = new LCDClient({
          URL: 'https://bombay-lcd.terra.dev',
          chainID: 'bombay-12',
        });

        const wallet = new Wallet(
          lcd,
          new MnemonicKey({
            mnemonic:
              'jungle asthma machine bring result credit wisdom dinosaur office book reopen ladder dune gadget choice insane festival inspire drive female speed evil wreck acid',
          }),
        );

        const signedTx = await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });

        return lcd.tx.broadcastSync(signedTx).then((result) => {
          return result.txhash;
        });
      },
    });
  });

  // test input assertion except amount
  it('send-ust-assert-input', async () => {
    //address: terra1grng2qchtur284ylk6g5xplnutjg6smnwlwrhj
    const account = new MnemonicKey({
      mnemonic:
        'supply sting ranch post eternal decline silly want outside prize crazy rapid foil gain soft above left castle illness cargo night game satisfy legend',
    });

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });

    await anchorEarn
      .send({
        currency: DENOMS.UST,
        recipient: 'invalid',
        amount: '0.01',
      })
      .catch((e: Error) =>
        expect(e.message).toContain('Invalid Terra account address'),
      );
  });

  it('withdraw', async () => {
    //address: terra1grng2qchtur284ylk6g5xplnutjg6smnwlwrhj
    const account = new MnemonicKey({
      mnemonic:
        'supply sting ranch post eternal decline silly want outside prize crazy rapid foil gain soft above left castle illness cargo night game satisfy legend',
    });
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });
    const withdraw = await anchorEarn.withdraw({
      amount: '0.01',
      currency: DENOMS.UST,
    });

    if (withdraw instanceof TxOutput) {
      console.log(withdraw.toData());
    }
    expect(withdraw.type).toEqual('withdraw');
  });

  it('failed-withdraw', async () => {
    //failure: account does not have deposit
    //address: terra1ypnfshpkyh8rzyh39unz0xsj3x8jd59hru8fwe
    const failure_account = new MnemonicKey({
      mnemonic:
        'scale forward black ten treat vibrant ribbon sleep beyond change cattle super argue enjoy nothing task always bitter slide ozone burger thank gentle borrow',
    });

    const failedAnchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: failure_account.privateKey,
    });

    await failedAnchorEarn
      .withdraw({
        amount: '1000000000000',
        currency: DENOMS.UST,
      })
      .catch((e: Error) => {
        expect(e.message).toEqual('There is no deposit for the user');
      });

    await failedAnchorEarn
      .withdraw({
        amount: '0',
        currency: DENOMS.UST,
      })
      .catch((e: Error) => {
        expect(e.message).toEqual('Invalid zero amount');
      });
  });

  it('withdraw-custom-signer', async () => {
    //address: terra10zkyac50dgx830uepym5508h7vukqufr6y5wdy

    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      address: 'terra10zkyac50dgx830uepym5508h7vukqufr6y5wdy',
    });

    await anchorEarn.withdraw({
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
            URL: 'https://bombay-lcd.terra.dev',
            chainID: 'bombay-12',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
    });
  });

  it('withdraw-aust', async () => {
    //address: terra1zk6rpwmxdh9md4hk3l9apnsfapqa59lh9tqyxa
    const account = new MnemonicKey({
      mnemonic:
        'tide tortoise focus risk educate hotel actress season wish caught paper fashion gift tired cute poet cute scan wage local float nest task hire',
    });
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      privateKey: account.privateKey,
    });
    const withdraw = await anchorEarn.withdraw({
      amount: '0.01',
      currency: DENOMS.AUST,
    });
    if (withdraw instanceof TxOutput) {
      console.log(withdraw.toData());
    }
    expect(withdraw.type).toEqual('withdraw');
  });

  it('withdraw-custom-broadcast', async () => {
    //address: terra18cs8wjs66kvqgnrj68lak6tfw26z006h00zu4q
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      mnemonic:
        'carpet glue angle people endorse thunder unknown fly choose fat dash hurt jeans lottery omit reject immense vocal hockey slide loop episode host comic',
    });
    const customBroadcaster = async (tx: Msg[]) => {
      const lcd = new LCDClient({
        URL: 'https://bombay-lcd.terra.dev',
        chainID: 'bombay-12',
      });

      const wallet = new Wallet(
        lcd,
        new MnemonicKey({
          mnemonic:
            'carpet glue angle people endorse thunder unknown fly choose fat dash hurt jeans lottery omit reject immense vocal hockey slide loop episode host comic',
        }),
      );

      const signedTx = await wallet.createAndSignTx({
        msgs: tx,
        gasAdjustment: 2,
        gasPrices: { uusd: 0.15 },
      });

      return lcd.tx.broadcastSync(signedTx).then((result) => {
        return result.txhash;
      });
    };
    await anchorEarn.withdraw({
      amount: '0.01',
      currency: DENOMS.AUST,
      log: (data) => {
        console.log(data);
      },
      customBroadcaster: customBroadcaster,
    });
  });

  it('balance', async () => {
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      address: 'terra18cs8wjs66kvqgnrj68lak6tfw26z006h00zu4q',
    });

    const userBalance = await anchorEarn.balance({
      currencies: [DENOMS.UST],
    });

    console.log(userBalance.toData());
  });

  it('market', async () => {
    const anchorEarn = new AnchorEarn({
      chain: CHAINS.TERRA,
      network: NETWORKS.BOMBAY_12,
      address: 'terra18cs8wjs66kvqgnrj68lak6tfw26z006h00zu4q',
    });

    const market = await anchorEarn.market({
      currencies: [DENOMS.UST],
    });

    console.log(market.toData());
  });
});
