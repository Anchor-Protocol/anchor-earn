export interface CustomSigner<T, K> {
  customSigner?: (tx: T) => Promise<K>;
}
