export const tee = <T>(callback: (result: T) => void | Promise<void>) => async (
  result: T,
) => {
  await callback(result);
  return result;
};
