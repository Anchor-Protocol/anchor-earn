export function assertInput<T, K, V>(
  customSigner?: (tx: T) => Promise<K>,
  customeBroadcaster?: (tx: K) => Promise<V>,
  address?: string,
) {
  if (
    customSigner &&
    address === undefined &&
    customeBroadcaster === undefined
  ) {
    throw new Error('Address must be provided');
  }
  if (address && customSigner === undefined) {
    throw new Error('Address must be used with customSigner');
  }
}
