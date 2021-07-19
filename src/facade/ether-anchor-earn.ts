import { Contract, ethers, providers, Wallet } from 'ethers';

import { MarketOutput } from './market-query-output';
import { Output } from './output';
import { OperationError } from './tx-output';
import {
  AnchorEarnOperations,
  DepositOption,
  QueryOption,
  SendOption,
  WithdrawOption,
} from './types';
import { NETWORKS } from '../types';
import { BalanceOutput } from './user-query-output';
import { CustomSigner } from './custom-signer';
import { CustomBroadcaster } from './custom-broadcaster';
import { IConversionPool, IERC20, IRouterV2 } from './interface/ether';

export namespace Ether {
  export type UnsignedTx = providers.TransactionRequest;
  export type SignedTx = string;

  type EthNetwork = NETWORKS.ETHER_MAINNET | NETWORKS.ETHER_ROPSTEN;

  enum Tokens {
    UST = 'ust',
    DAI = 'dai',
    USDT = 'usdt',
    USDC = 'usdc',
    BUSD = 'busd',
    FRAX = 'frax',
  }

  enum aTokens {
    aUST = 'aust',
    aDAI = 'adai',
    aUSDT = 'ausdt',
    aUSDC = 'ausdc',
    aBUSD = 'abusd',
    aFRAX = 'afrax',
  }

  export type DENOMS = Tokens | aTokens;

  interface Contracts {
    router: string;
    conversionPools: {
      [address: string]: {
        token: Exclude<Tokens, Tokens.UST>;
        atoken: Exclude<aTokens, aTokens.aUST>;
      };
    };
  }

  export const DEPLOYMENTS: {
    [network in EthNetwork]: Contracts;
  } = {
    homestead: {
      router: '',
      conversionPools: {},
    },
    ropsten: {
      router: '',
      conversionPools: {},
    },
  };

  interface AnchorEarnArgs {
    network: NETWORKS;
    endpoint: string;
    privateKey?: Buffer;
    address?: string;
  }

  type ConversionAsset = Exclude<DENOMS, Tokens.UST | aTokens.aUST>;

  function isConversionAsset(denom: DENOMS): denom is ConversionAsset {
    const tokens = Object.values(Tokens)
      .filter((v) => v !== Tokens.UST)
      .map((v) => v.toString());
    const atokens = Object.values(aTokens)
      .filter((v) => v !== aTokens.aUST)
      .map((v) => v.toString());
    return (
      tokens.includes(denom.toString()) || atokens.includes(denom.toString())
    );
  }

  interface ConversionAssetInfo {
    pool: string;
    converted: ConversionAsset;
  }

  export class AnchorEarn
    implements AnchorEarnOperations<DENOMS, UnsignedTx, SignedTx> {
    public readonly network: EthNetwork;
    public readonly conversionAssets: {
      [denom in ConversionAsset]: ConversionAssetInfo;
    };
    private readonly _provider: ethers.providers.Provider;
    private readonly _wallet: Wallet | null = null;
    private readonly _address: string | null = null;

    constructor({ network, endpoint, privateKey, address }: AnchorEarnArgs) {
      // ========================== network
      switch (network) {
        case NETWORKS.ETHER_MAINNET:
        case NETWORKS.ETHER_ROPSTEN:
          break;
        default:
          throw new Error(`invalid ether network type: ${network}.`);
      }

      this.network = network;
      this._provider = new ethers.providers.JsonRpcProvider(
        endpoint,
        network.toString(),
      );

      // ========================== account
      if (privateKey) {
        this._wallet = new Wallet(privateKey, this._provider);
        this._address = this._wallet.address;
      }
      if (address) {
        if (this._address && this._address !== address) {
          throw new Error(
            `provided key's address is not the same as provided address`,
          );
        } else {
          this._address = address;
        }
      }

      if (!this._address) throw new Error('you must provide address info');

      // ========================== assets
      this.conversionAssets = Object.entries(
        this.deployments.conversionPools,
      ).reduce((acc, [address, { token, atoken }]) => {
        acc[token] = { pool: address, converted: atoken };
        acc[atoken] = { pool: address, converted: token };
        return acc;
      }, {} as { [denom in ConversionAsset]: ConversionAssetInfo });
    }

    get address(): string {
      return this._address;
    }

    get blocktime(): Promise<number> {
      return new Promise((resolve, reject) =>
        this._provider
          .getBlock('latest')
          .then(({ timestamp }) => resolve(timestamp))
          .catch(reject),
      );
    }

    get deployments(): Contracts {
      return DEPLOYMENTS[this.network];
    }

    private token(addr: string): Contract {
      return new Contract(addr, IERC20.abi, this._provider);
    }

    private router(addr: string): Contract {
      return new Contract(addr, IRouterV2.abi, this._provider);
    }

    private conversionPool(addr: string): Contract {
      return new Contract(addr, IConversionPool.abi, this._provider);
    }

    // returns [token, atoken] tuple
    private async fetchAddressesOf(token: DENOMS): Promise<[string, string]> {
      if (isConversionAsset(token)) {
        const pool = this.conversionPool(this.conversionAssets[token].pool);
        const tokenAddr = await pool.inputToken();
        const atokenAddr = await pool.outputToken();
        return [tokenAddr, atokenAddr];
      } else {
        const router = this.router(this.deployments.router);
        const tokenAddr = await router.wUST();
        const atokenAddr = await router.aUST();
        return [tokenAddr, atokenAddr];
      }
    }

    private async signAndBroadcast<
      T extends CustomSigner<UnsignedTx, SignedTx> &
        CustomBroadcaster<UnsignedTx, SignedTx>
    >(
      tx: UnsignedTx,
      { customSigner, customBroadcaster }: T,
    ): Promise<providers.TransactionResponse> {
      if (!(customSigner && customBroadcaster) && this._wallet === null) {
        throw new Error('environment not satisfied');
      }

      if (customBroadcaster) {
        const txHash = await customBroadcaster(tx);
        return this._provider.getTransaction(txHash);
      }

      const signer =
        customSigner ||
        ((tx: providers.TransactionRequest) =>
          this._wallet.signTransaction(tx));

      const signedTx = await signer(tx);
      return this._provider.sendTransaction(signedTx);
    }

    async deposit(
      option: DepositOption<Tokens, UnsignedTx, SignedTx>,
    ): Promise<Output | OperationError> {
      const { amount, currency } = option;

      if (currency !== Tokens.UST) {
        throw new Error(`unsupported currency ${currency}`);
      }

      const [tokenAddr] = await this.fetchAddressesOf(currency);

      const token = this.token(tokenAddr);
      const { contract: target, funcSig } =
        currency === Tokens.UST
          ? {
              contract: this.router(this.deployments.router),
              funcSig: 'depositStable(uint256)',
            }
          : {
              contract: this.conversionPool(this.conversionAssets[currency]),
              funcSig: 'deposit(uint256)',
            };

      const allowance = await token.allowance(this.address, target.address);
      if (allowance.lt(amount)) {
        throw new Error('deposit amount exceeds allowance');
      }

      const unsignedTx = await target.populateTransaction[funcSig](amount);
      const txResp = await this.signAndBroadcast(unsignedTx, option);

      throw new Error('Method not implemented.');
    }

    async withdraw(
      option: WithdrawOption<aTokens, UnsignedTx, SignedTx>,
    ): Promise<Output | OperationError> {
      const { amount, currency } = option;

      if (currency !== aTokens.aUST) {
        throw new Error(`unsupported currency ${currency}`);
      }

      const [, atokenAddr] = await this.fetchAddressesOf(currency);

      const atoken = this.token(atokenAddr);
      const { contract: target, funcSig } =
        currency === aTokens.aUST
          ? {
              contract: this.router(this.deployments.router),
              funcSig: 'redeemStable(uint256)',
            }
          : {
              contract: this.conversionPool(this.conversionAssets[currency]),
              funcSig: 'redeem(uint256)',
            };

      const allowance = await atoken.allowance(this.address, target.address);
      if (allowance.lt(amount)) {
        throw new Error('deposit amount exceeds allowance');
      }

      const unsignedTx = await target.populateTransaction[funcSig](amount);
      const txResp = await this.signAndBroadcast(unsignedTx, option);

      throw new Error('Method not implemented.');
    }

    async send(
      option: SendOption<DENOMS, UnsignedTx, SignedTx>,
    ): Promise<Output | OperationError> {
      const { amount, currency, recipient } = option;
    }

    async balance({ currencies }: QueryOption<DENOMS>): Promise<BalanceOutput> {
      throw new Error('Method not implemented.');
    }

    async market({ currencies }: QueryOption<DENOMS>): Promise<MarketOutput> {
      throw new Error('Method not implemented.');
    }
  }
}
