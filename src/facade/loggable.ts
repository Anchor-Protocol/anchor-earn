export interface Loggable<T> {
  log?: (data: T) => Promise<void> | void;
}
