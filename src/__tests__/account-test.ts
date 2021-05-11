import { Account, CHAINS } from '../facade';

describe('account', () => {
  it('decode', () => {
    const account = new Account(CHAINS.TERRA);
    console.log(account.toData());
  });
});
