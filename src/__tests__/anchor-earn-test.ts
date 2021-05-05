import { AnchorEarn, OutputImpl } from '../facade';
import { LCDClient, MnemonicKey, Msg, Wallet } from '@terra-money/terra.js';
import { DENOMS } from '../address-provider';
import { Parse } from '../utils/parse-input';
import { CHAIN, NETWORKS } from '../facade/types';
import generateTerraAccessToken = Parse.generateTerraAccessToken;

//accounts were created for test purposes and they have 5000ust and 5000aust.

describe('anchor-earn', () => {
  it('deposit', async () => {
    //address: terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u
    const account = new MnemonicKey({
      mnemonic:
        'kidney cannon silk dust tube flight trophy approve identify kind purse install proud kind pigeon bleak this clever mosquito change cash mango sample prepare',
    });

    const anchorEarn = new AnchorEarn({
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
      accessToken: generateTerraAccessToken(account.privateKey),
    });

    const deposit = await anchorEarn.earn.deposit({
      amount: '0.01',
      currency: DENOMS.UST,
    });

    if (deposit instanceof OutputImpl) {
      console.log(deposit.toData());
    }
  });

  it('deposit-customized-sign', async () => {
    //address: terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u
    const anchorEarn = new AnchorEarn({
      chain: CHAIN.TERRA,
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
  });

  // it('failed-deposit', async () => {
  //   //address: terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u
  //   const account = new MnemonicKey({
  //     mnemonic:
  //       'kidney cannon silk dust tube flight trophy approve identify kind purse install proud kind pigeon bleak this clever mosquito change cash mango sample prepare',
  //   });
  //
  //   const anchorEarn = new AnchorEarn({
  //     network: NETWORKS.TEQUILA0004,
  //     accessToken: account.privateKey.toString('base64'),
  //   });
  //   const deposit = anchorEarn.deposit({
  //     amount: '0.01',
  //     currency: DENOMS.UST,
  //   });
  //
  //   // deposit.print();
  //   // expect(deposit.amount).toEqual('10000');
  // });

  it('send-aust', async () => {
    //address: terra1grng2qchtur284ylk6g5xplnutjg6smnwlwrhj
    const account = new MnemonicKey({
      mnemonic:
        'supply sting ranch post eternal decline silly want outside prize crazy rapid foil gain soft above left castle illness cargo night game satisfy legend',
    });
    const anchorEarn = new AnchorEarn({
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
      accessToken: generateTerraAccessToken(account.privateKey),
    });
    const sendAust = await anchorEarn.earn.send(DENOMS.AUST, {
      recipient: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
      amount: '0.01',
    });

    if (sendAust instanceof OutputImpl) {
      console.log(sendAust.toData());
    }
  });

  it('send-ust', async () => {
    //address: terra1grng2qchtur284ylk6g5xplnutjg6smnwlwrhj
    const account = new MnemonicKey({
      mnemonic:
        'supply sting ranch post eternal decline silly want outside prize crazy rapid foil gain soft above left castle illness cargo night game satisfy legend',
    });
    const anchorEarn = new AnchorEarn({
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
      accessToken: generateTerraAccessToken(account.privateKey),
    });
    const sendUst = await anchorEarn.earn.send(DENOMS.UST, {
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
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
      accessToken: generateTerraAccessToken(account.privateKey),
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
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
      accessToken: generateTerraAccessToken(failure_account.privateKey),
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

  it('balance', async () => {
    const anchorEarn = new AnchorEarn({
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
    });

    const userBalance = await anchorEarn.earn.balance({
      currencies: [DENOMS.UST],
      address: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
    });

    console.log(userBalance.toData());
  });

  it('market', async () => {
    const anchorEarn = new AnchorEarn({
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
      address: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
    });

    const market = await anchorEarn.earn.market({
      currencies: [DENOMS.UST],
    });

    console.log(market.toData());
  });
});
