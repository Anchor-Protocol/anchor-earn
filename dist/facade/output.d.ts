export declare enum TxType {
    SEND = "send",
    DEPOSIT = "deposit",
    WITHDRAW = "withdraw"
}
export interface TxDetails {
    chain: string;
    network: string;
    height: number;
    timestamp: Date;
    txHash: string;
}
export interface Output {
    chain: string;
    network: string;
    status: STATUS;
    type: TxType;
    currency: string;
    amount: string;
    txDetails: TxDetails[];
    txFee: string;
    deductedTax?: string;
}
export declare enum STATUS {
    SUCCESSFUL = "successful",
    UNSUCCESSFUL = "unsuccessful",
    IN_PROGRESS = "in-progress"
}
export declare enum CHAINS {
    TERRA = "terra"
}
export declare enum NETWORKS {
    COLUMBUS_5 = 0,
    BOMBAY_12 = 1
}
