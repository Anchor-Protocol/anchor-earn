import { BlockTxBroadcastResult, Coin, Coins, LCDClient, Msg, MsgSend, Numeric, Fee, Wallet, Tx } from '@terra-money/terra.js';
import { Fabricator, OmitAddress } from '../fabricators';
import { AddressProvider } from '../address-provider';
import { SyncTxBroadcastResult } from '@terra-money/terra.js/dist/client/lcd/api/TxAPI';
export interface OperationGasParameters {
    fee?: Fee;
    gasPrices?: Coins.Input;
    gasAdjustment?: Numeric.Input;
}
export interface Operation {
    generateWithAddress(address: string): Msg[];
    generateWithWallet(wallet: Wallet): Msg[];
    creatTx(wallet: Wallet, gasParameters: OperationGasParameters): Promise<Tx>;
    execute(wallet: Wallet, gasParameters: OperationGasParameters): Promise<SyncTxBroadcastResult>;
}
export declare class OperationImpl<FabricatorInputType> implements Operation {
    private _fabricator;
    private _option;
    private _addressProvider;
    constructor(fabricator: Fabricator<FabricatorInputType>, option: OmitAddress<FabricatorInputType>, addressProvider: AddressProvider);
    generateWithAddress(address: string): Msg[];
    generateWithWallet(wallet: Wallet): Msg[];
    creatTx(wallet: Wallet, { fee, gasPrices, gasAdjustment }: OperationGasParameters): Promise<Tx>;
    execute(wallet: Wallet, { fee, gasPrices, gasAdjustment }: OperationGasParameters): Promise<BlockTxBroadcastResult>;
}
export declare function sendSignedTransaction(lcd: LCDClient, tx: Tx): Promise<SyncTxBroadcastResult>;
export declare function createNativeSend(sender: string, options: {
    recipient: string;
    coin: Coin;
}): MsgSend;
export declare function createAndSignMsg(wallet: Wallet, { fee, gasPrices, gasAdjustment }: OperationGasParameters, msgs: Msg[]): Promise<Tx>;
