export declare const tee: <T>(callback: (result: T) => void | Promise<void>) => (result: T) => Promise<T>;
