export interface CustomBroadcaster<T, K> {
  customBroadcaster?: (tx: T) => Promise<K>;
}
