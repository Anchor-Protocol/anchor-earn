export function assertInput<T, K>(
  customSigner?: (tx: T) => Promise<K>,
  customBroadcaster?: (tx: T) => Promise<string>,
  address?: string,
) {
  if (customSigner && customBroadcaster) {
    throw new Error(
      'Either customSigner or customBroadcaster must be provided',
    );
  }
  if ((customSigner || customBroadcaster) && address === undefined) {
    throw new Error('Address must be provided');
  }
  if (
    address &&
    customSigner === undefined &&
    customBroadcaster === undefined
  ) {
    throw new Error(
      'Address must be used with customSigner or customBroadcaster',
    );
  }
}
