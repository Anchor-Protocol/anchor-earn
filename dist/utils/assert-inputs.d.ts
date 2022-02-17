export declare function assertInput<T, K>(customSigner?: (tx: T) => Promise<K>, customBroadcaster?: (tx: T) => Promise<string>): void;
