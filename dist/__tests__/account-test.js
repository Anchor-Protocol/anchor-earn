"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const facade_1 = require("../facade");
describe('account', () => {
    it('decode', () => {
        const account = new facade_1.Account(facade_1.CHAINS.TERRA);
        console.log(account.toData());
    });
});
