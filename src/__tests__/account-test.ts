import { Account } from '../facade/account';
import { Parse } from '../utils/parse-input';
import getAccessToken = Parse.getAccessToken;

describe('account', () => {
  it('decode', () => {
    const account = new Account();
    const privateKey = Buffer.from(
      getAccessToken(account.accessToken),
      'base64',
    );
    console.log(account.accessToken);
    expect(account.get_private_key()).toEqual(privateKey);
  });
});
