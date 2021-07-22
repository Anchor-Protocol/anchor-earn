import {
  BigNumber,
  constants,
  Contract,
  ethers,
  PopulatedTransaction,
  providers,
  utils,
  Wallet,
} from 'ethers';

import { MarketEntry, MarketOutput } from './market-query-output';
import { Output, STATUS, TxDetails, TxType } from './output';
import { OperationError } from './tx-output';
import {
  AnchorEarnOperations,
  DepositOption,
  QueryOption,
  SendOption,
  WithdrawOption,
} from './types';
import { CHAINS, NETWORKS } from '../types';
import { BalanceEntry, BalanceOutput } from './user-query-output';
import { CustomSigner } from './custom-signer';
import { CustomBroadcaster } from './custom-broadcaster';
import {
  IConversionPool,
  IERC20,
  IExchangeRateFeeder,
  IRouterV2,
} from './interface/ether';
import { Loggable } from './loggable';
import axios from 'axios';

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

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

interface Contracts {
  feeder: string;
  router: string;
  conversionPools: {
    [address: string]: {
      token: Exclude<Tokens, Tokens.UST>;
      atoken: Exclude<aTokens, aTokens.aUST>;
    };
  };
}

type ConversionAsset = Exclude<Tokens | aTokens, Tokens.UST | aTokens.aUST>;

type ConvertedAssetType<T> = T extends Tokens
  ? Exclude<aTokens, aTokens.aUST>
  : T extends aTokens
  ? Exclude<Tokens, Tokens.UST>
  : never;

function isTokens(denom: Tokens | aTokens): denom is Tokens {
  return Object.values(Tokens)
    .map((v) => v.toString())
    .includes(denom.toString());
}

function isATokens(denom: Tokens | aTokens): denom is aTokens {
  return Object.values(aTokens)
    .map((v) => v.toString())
    .includes(denom.toString());
}

function isConversionAsset(denom: Tokens | aTokens): denom is ConversionAsset {
  return (
    (denom !== Tokens.UST && denom !== aTokens.aUST && isTokens(denom)) ||
    isATokens(denom)
  );
}

interface ConversionAssetInfo<T> {
  pool: string;
  converted: ConvertedAssetType<T>;
}

export namespace Ether {
  export type UnsignedTx = providers.TransactionRequest;
  export type SignedTx = string;
  export type Denoms = Tokens | aTokens;
  export type Network = NETWORKS.ETHER_MAINNET | NETWORKS.ETHER_ROPSTEN;

  export const EthAnchorAPI: { [network in Network]: string } = {
    homestead: 'https://eth-api.anchorprotocol.com/api/v1/stablecoin_info/uusd',
    ropsten: 'https://eth-api.anchorprotocol.com/api/v1/stablecoin_info/uusd',
  };

  export const DEPLOYMENTS: {
    [network in Network]: Contracts;
  } = {
    homestead: {
      feeder: '',
      router: '',
      conversionPools: {},
    },
    ropsten: {
      feeder: '',
      router: '',
      conversionPools: {},
    },
  };

  interface Args {
    network: NETWORKS;
    endpoint: string;
    privateKey?: Buffer;
    address?: string;
  }

  interface OutputFragment {
    status: STATUS;
    type: TxType;
    txDetails?: TxDetails[];
    txFee?: string;
  }

  // alias
  enum ActionType {
    Deposit = TxType.DEPOSIT,
    Withdraw = TxType.WITHDRAW,
    Transfer = TxType.SEND,
  }

  enum ContractType {
    Token = 'token',
    Router = 'router',
    Feeder = 'feeder',
    ConversionPool = 'conversionPool',
  }

  export class AnchorEarn
    implements AnchorEarnOperations<Denoms, UnsignedTx, SignedTx> {
    public readonly chain: CHAINS;
    public readonly network: Network;
    public readonly conversionAssets: {
      [asset in ConversionAsset]: ConversionAssetInfo<asset>;
    };
    public readonly address: string | null = null;

    private readonly _api: string;
    private readonly _provider: ethers.providers.Provider;
    private readonly _wallet: Wallet | null = null;
    private readonly _deployments: Contracts;
    private readonly _confirmation: number = 2;

    constructor({ network, endpoint, privateKey, address }: Args) {
      this.chain = CHAINS.ETHER;

      // ========================== network
      switch (network) {
        case NETWORKS.ETHER_MAINNET:
        case NETWORKS.ETHER_ROPSTEN:
          break;
        default:
          throw new Error(`invalid ether network type: ${network}.`);
      }

      this.network = network;
      this._api = EthAnchorAPI[this.network];
      this._deployments = DEPLOYMENTS[this.network];
      this._provider = new ethers.providers.JsonRpcProvider(
        endpoint,
        network.toString(),
      );

      // ========================== account
      if (privateKey) {
        this._wallet = new Wallet(privateKey, this._provider);
        this.address = this._wallet.address;
      }
      if (address) {
        if (this.address && this.address !== address) {
          throw new Error(
            `provided key's address is not the same as provided address`,
          );
        } else {
          this.address = address;
        }
      }

      if (!this.address) throw new Error('you must provide address info');

      // ========================== assets
      this.conversionAssets = Object.entries(
        this._deployments.conversionPools,
      ).reduce(
        (acc, [pool, { token, atoken }]) => ({
          ...acc,
          token: { pool, converted: atoken },
          atoken: { pool, converted: token },
        }),
        {} as { [asset in ConversionAsset]: ConversionAssetInfo<asset> },
      );
    }

    private contract(type: ContractType, addr: string): Contract {
      switch (type) {
        case ContractType.Token:
          return new Contract(addr, IERC20.abi, this._provider);
        case ContractType.Router:
          return new Contract(addr, IRouterV2.abi, this._provider);
        case ContractType.Feeder:
          return new Contract(addr, IExchangeRateFeeder.abi, this._provider);
        case ContractType.ConversionPool:
          return new Contract(addr, IConversionPool.abi, this._provider);
      }
    }

    // returns [token, atoken] tuple
    private async fetchAddressesOf(token: Denoms): Promise<string> {
      if (isConversionAsset(token)) {
        const pool = this.contract(
          ContractType.Token,
          this.conversionAssets[token].pool,
        );
        /* eslint-disable  @typescript-eslint/no-unsafe-call */
        return isTokens(token)
          ? await pool.inputToken()
          : await pool.outputToken();
      } else {
        const router = this.contract(
          ContractType.Router,
          this._deployments.router,
        );
        /* eslint-disable  @typescript-eslint/no-unsafe-call */
        return isTokens(token) ? await router.wUST() : await router.aUST();
      }
    }

    async deposit(
      option: DepositOption<Tokens, UnsignedTx, SignedTx>,
    ): Promise<Output | OperationError> {
      const { amount: rawAmount, currency } = option;
      const amount = utils.parseEther(rawAmount);

      const tokenAddr = await this.fetchAddressesOf(currency);

      const token = this.contract(ContractType.Token, tokenAddr);
      const { contract: target, funcSig } =
        currency === Tokens.UST
          ? {
              contract: this.contract(
                ContractType.Router,
                this._deployments.router,
              ),
              funcSig: 'depositStable(uint256)',
            }
          : {
              contract: this.contract(
                ContractType.ConversionPool,
                this.conversionAssets[currency].pool,
              ),
              funcSig: 'deposit(uint256)',
            };

      let txDetails: TxDetails[];

      const unsignedApproveTx = await token.populateTransaction.approve(
        target.address,
        amount,
      );
      txDetails.push(
        await this.signAndBroadcast(unsignedApproveTx, TxType.DEPOSIT, option),
      );

      const unsignedDepositTx = await target.populateTransaction[funcSig](
        amount,
      );
      txDetails.push(
        await this.signAndBroadcast(unsignedDepositTx, TxType.DEPOSIT, option),
      );

      return this.toOutput(
        {
          status: STATUS.SUCCESSFUL,
          type: TxType.DEPOSIT,
          txDetails,
          txFee: this.accumulateTxFee([unsignedApproveTx, unsignedDepositTx]),
        },
        option,
      );
    }

    async withdraw(
      option: WithdrawOption<aTokens, UnsignedTx, SignedTx>,
    ): Promise<Output | OperationError> {
      const { amount: rawAmount, currency } = option;
      const amount = utils.parseEther(rawAmount);

      const atokenAddr = await this.fetchAddressesOf(currency);

      const atoken = this.contract(ContractType.Token, atokenAddr);
      const { contract: target, funcSig } =
        currency === aTokens.aUST
          ? {
              contract: this.contract(
                ContractType.Router,
                this._deployments.router,
              ),
              funcSig: 'redeemStable(uint256)',
            }
          : {
              contract: this.contract(
                ContractType.ConversionPool,
                this.conversionAssets[currency].pool,
              ),
              funcSig: 'redeem(uint256)',
            };

      let txDetails: TxDetails[];

      const unsignedApproveTx = await atoken.populateTransaction.approve(
        target.address,
        amount,
      );
      txDetails.push(
        await this.signAndBroadcast(unsignedApproveTx, TxType.WITHDRAW, option),
      );

      const unsignedRedeemTx = await target.populateTransaction[funcSig](
        amount,
      );
      txDetails.push(
        await this.signAndBroadcast(unsignedRedeemTx, TxType.WITHDRAW, option),
      );

      return this.toOutput(
        {
          status: STATUS.SUCCESSFUL,
          type: TxType.WITHDRAW,
          txDetails,
          txFee: this.accumulateTxFee([unsignedApproveTx, unsignedRedeemTx]),
        },
        option,
      );
    }

    async send(
      option: SendOption<Denoms, UnsignedTx, SignedTx>,
    ): Promise<Output | OperationError> {
      const { amount: rawAmount, currency, recipient } = option;
      const amount = utils.parseEther(rawAmount);

      const tokenAddr = await this.fetchAddressesOf(currency);

      let txDetails: TxDetails[];

      const token = this.contract(ContractType.Token, tokenAddr);
      const unsignedTransferTx = await token.populateTransaction.transfer(
        recipient,
        amount,
      );
      txDetails.push(
        await this.signAndBroadcast(unsignedTransferTx, TxType.SEND, option),
      );

      return this.toOutput(
        {
          status: STATUS.SUCCESSFUL,
          type: TxType.SEND,
          txDetails,
          txFee: this.accumulateTxFee([unsignedTransferTx]),
        },
        option,
      );
    }

    async balance({ currencies }: QueryOption<Tokens>): Promise<BalanceOutput> {
      const balances = await Promise.all(
        currencies.map(
          async (currency): Promise<BalanceEntry> => {
            const tokenAddr = await this.fetchAddressesOf(currency);
            const token = this.contract(ContractType.Token, tokenAddr);
            const tokenBalance = await token.balanceOf(this.address);

            let conversionAsset: aTokens;
            if (currency === Tokens.UST) {
              conversionAsset = aTokens.aUST;
            } else {
              conversionAsset = this.conversionAssets[currency].converted;
            }

            const atokenAddr = await this.fetchAddressesOf(conversionAsset);
            const atoken = this.contract(ContractType.Token, atokenAddr);
            /* eslint-disable  @typescript-eslint/no-unsafe-call */
            const atokenBalance = await atoken.balanceOf(this.address);

            const feeder = this.contract(
              ContractType.Feeder,
              this._deployments.feeder,
            );
            const exchangeRate = await feeder.exchangeRateOf(atokenAddr, true);

            return {
              currency,
              account_balance: utils.formatEther(tokenBalance),
              deposit_balance: utils.formatEther(
                atokenBalance.mul(exchangeRate).div(constants.WeiPerEther),
              ),
            };
          },
        ),
      );

      const accumulated = balances.reduce(
        (
          { totalBalance, totalDeposit },
          { account_balance, deposit_balance },
        ) => ({
          totalBalance: totalBalance.add(utils.parseEther(account_balance)),
          totalDeposit: totalDeposit.add(utils.parseEther(deposit_balance)),
        }),
        { totalBalance: BigNumber.from(0), totalDeposit: BigNumber.from(0) },
      );

      const blockNumber = await this._provider.getBlockNumber();

      return new BalanceOutput(
        this.chain.toString(),
        this.network.toString(),
        blockNumber,
        this.address,
        balances,
        utils.formatEther(accumulated.totalBalance),
        utils.formatEther(accumulated.totalDeposit),
      );
    }

    async market({ currencies }: QueryOption<Tokens>): Promise<MarketOutput> {
      const markets = await Promise.all(
        currencies.map(
          async (currency): Promise<MarketEntry> => {
            if (currency === Tokens.UST) {
              interface MarketResponse {
                liquid_terra: string;
                current_apy: string;
              }

              const resp = await axios.get<MarketResponse>(this._api);
              return {
                currency,
                liquidity: utils.formatUnits(resp.data.liquid_terra, 'mwei'),
                APY: resp.data.current_apy,
              };
            } else {
              const pool = this.contract(
                ContractType.ConversionPool,
                this.conversionAssets[currency].pool,
              );
              const feeder = this.contract(
                ContractType.Feeder,
                this._deployments.feeder,
              );

              const atokenAddr = await this.fetchAddressesOf(aTokens.aUST);
              const atoken = this.contract(ContractType.Token, atokenAddr);
              const atokenBalance = await atoken.balanceOf(pool.address);

              const exchangeRate = await feeder.exchangeRateOf(
                atokenAddr,
                true,
              );

              const tokenAddr = await this.fetchAddressesOf(currency);
              const feederInfo = await feeder.tokens(tokenAddr);
              let apy = BigNumber.from(0);
              for (
                let i = BigNumber.from(0);
                i.lt(BigNumber.from(YEAR).div(feederInfo.period));
                i = i.add(1)
              ) {
                apy = apy.mul(feederInfo.weight).div(constants.WeiPerEther);
              }

              return {
                currency,
                liquidity: utils.formatEther(
                  atokenBalance.mul(exchangeRate).div(constants.WeiPerEther),
                ),
                APY: utils.formatEther(apy),
              };
            }
          },
        ),
      );

      const blockNumber = await this._provider.getBlockNumber();

      return new MarketOutput(
        this.chain.toString(),
        this.network.toString(),
        blockNumber,
        markets,
      );
    }

    private async waitForTx(txHash: string): Promise<void> {
      await this._provider.waitForTransaction(txHash, this._confirmation);
    }

    private accumulateTxFee(txs: PopulatedTransaction[]): string {
      return txs
        .reduce(
          (acc, tx) => acc.add(tx.gasLimit.mul(tx.gasPrice)),
          BigNumber.from(0),
        )
        .toString();
    }

    private toOutput<
      T extends CustomSigner<UnsignedTx, SignedTx> &
        CustomBroadcaster<UnsignedTx, SignedTx> &
        Loggable<Output | OperationError> & { currency: Denoms; amount: string }
    >(
      { status, type, txDetails = [], txFee }: OutputFragment,
      { currency, amount }: T,
    ): Output {
      return {
        chain: this.chain,
        network: this.network,
        status,
        type,
        currency,
        amount,
        txDetails,
        txFee,
      };
    }

    private toError(txType: TxType, e: Error): OperationError {
      return {
        chain: this.chain,
        network: this.network,
        status: STATUS.UNSUCCESSFUL,
        type: txType,
        error_msg: e.message,
      };
    }

    private respToDetail(txResp: providers.TransactionResponse): TxDetails {
      return {
        chain: this.chain,
        network: this.network,
        height: txResp.blockNumber,
        timestamp: new Date(txResp.timestamp * 1000),
        txHash: txResp.hash,
      };
    }

    private async signAndBroadcast<
      T extends CustomSigner<UnsignedTx, SignedTx> &
        CustomBroadcaster<UnsignedTx, SignedTx> &
        Loggable<Output | OperationError> & { currency: Denoms; amount: string }
    >(tx: PopulatedTransaction, txType: TxType, option: T): Promise<TxDetails> {
      const { customSigner, customBroadcaster } = option;
      const logger = option.log || (() => void 0);

      if (!(customSigner && customBroadcaster) && this._wallet === null) {
        throw new Error('environment not satisfied');
      }

      try {
        if (customBroadcaster) {
          const txHash = await customBroadcaster(tx);
          const txResp = await this._provider.getTransaction(txHash);
          return this.respToDetail(txResp);
        }

        const signer =
          customSigner ||
          ((tx: providers.TransactionRequest) =>
            this._wallet.signTransaction(tx));

        const signedTx = await signer(tx);
        const txResp = await this._provider.sendTransaction(signedTx);
        logger(
          this.toOutput(
            {
              status: STATUS.IN_PROGRESS,
              type: txType,
              txFee: tx.gasLimit.mul(tx.gasPrice).toString(),
            },
            option,
          ),
        );
        await this.waitForTx(txResp.hash);
        return this.respToDetail(txResp);
      } catch (e) {
        if (e instanceof Error) {
          logger(this.toError(txType, e));
          throw new Error(e.message);
        }
        throw e; // unexpected
      }
    }

    private async checkAssetBalance(
      token: Contract,
      expectedAmount: BigNumber,
      action: ActionType,
    ): Promise<void> {
      if (expectedAmount.lte(0)) {
        throw new Error(`invalid amount ${expectedAmount.toString()}`);
      }

      const actualAmount = await token.balanceOf(this.address);
      if (actualAmount.lt(expectedAmount)) {
        throw new Error(`${action} amount exceeds balance`);
      }
    }
  }
}
