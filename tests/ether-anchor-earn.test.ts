import { Wallet } from 'ethers';
import { AnchorEarn } from '../src/facade';
import { CHAINS, NETWORKS } from '../src/types';

const chain = CHAINS.ETHER;
const network = NETWORKS.ETHER_ROPSTEN;
const endpoint = '';
const wallet = new Wallet('<private_key>');

describe('ether-anchor-earn', () => {
  let earn: AnchorEarn<CHAINS.ETHER>;

  beforeEach(() => {
    earn = new AnchorEarn({
      chain,
      network,
      endpoint,
      privateKey: wallet.privateKey,
    });
  });

  describe('#deposit', () => {
    it('should work well', async () => {});
    it('should work with custom signer', async () => {});
    it('should work with custom broadcaster', async () => {});

    it('should fail if sender does not have enough balance', async () => {});
  });

  describe('#withdraw', () => {
    it('should work well', async () => {});
    it('should work with custom signer', async () => {});
    it('should work with custom broadcaster', async () => {});

    it('should fail if sender does not have enough balance', async () => {});
  });

  describe('#send', () => {
    it('should work well', async () => {});
    it('should work with custom signer', async () => {});
    it('should work with custom broadcaster', async () => {});

    it('should fail if sender does not have enough balance', async () => {});
  });

  describe('#balance', () => {
    it('should work well', async () => {});
  });

  describe('#market', () => {
    it('should work well', async () => {});
  });
});
