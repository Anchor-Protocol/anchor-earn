export function assertInput<T, K>(
  customSigner?: (tx: T) => Promise<K>,
  customBroadcaster?: (tx: T) => Promise<string>,
) {
  if (customSigner && customBroadcaster) {
    throw new Error(
      'Either customSigner or customBroadcaster must be provided',
    );
  }
}
