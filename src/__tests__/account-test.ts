import { Account } from '../facade/account';

describe('account', () => {
  it('decode', () => {
    const account = new Account();
    console.log(account.toData());
  });
});
