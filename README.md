# Anchor-earn

Anchor-earn is a client SDK for building applications that can interact with the earn functionality of Anchor Protocol from within JavaScript runtimes. 


> **NOTE** 
This SDK only supports the earn functionalities of anchor protocol and cannot be used for other functionalities like bond or borrow.

## Table of Contents <!-- omit in toc -->
- [Getting Started](#getting-started)
    - [Requirements](#requirements)
    - [Installation](#installation) 
- [Usage](#usage)
- [Examples](#examples)
- [CustomSigner](#customsigner)
- [Logabble](#loggable)
- [License](#license)
## Getting Started
A walk through of the steps to get started with Anchor-earn SDK alongside with a few use case examples are provided below.

## Requirements

- Node.js 12+
- NPM

## Installation
Anchor-earn is available as a package on NPM and it is independent from other Terra and Anchor SDKs.\
To your JavaScript project's `package.json` as dependencies using preferred package manager: 
```bash
npm install -S @anchor-protocol/anchor-earn
```
## Usage

### `Account` object
Anchor-earn provides a facility to create a wallet on the Terra blockchain.\
This functionality is accessible through the `Account` object.
```ts
const account = new Account();
```  
> **NOTE** It is crucial to store or write your account information before doing any interactions with the SDK. A user can have access to this info by printing the account.
```ts
console.log(account)
```

```
      Account {
        accAddress: 'terra15kwnsu3a539l8l6pcs6yspzas7urrtsgs4w5v4',
        publicKey: 'terrapub1addwnpepq2wc706a537ct954wfxxxwe8yhrqpuwxs2ejykya9jadwk0jj3ud5935v95',
        accessToken: 'TERRA_m2rIfcnwpIZXlxrdjpcSj7VOZHoRj8Sc1Wv8C9F09vY=',
        MnemonicKey: 'weird rent soft alien write globe october wish arena cream agree toe gain chunk club clip green night hobby keep void garden help diagram'
      }

```
`accessToken` is essential for later usage.

### `AnchorEarn` object
Anchor-earn provides facilities for two main use cases: 

- execute: Signs the message and broadcasts the message using Terra.js
- query: Runs a series of smart contract and chain queries through LCD

Both are these functions are accessible through the `AnchorEarn` object. 

To creat the `AnchorEarn` object.
```ts
    const anchorEarn = new AnchorEarn({
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
      accessToken: account.accessToken,
    });
```
The above example uses used `Account` object for using anchor-earn.
 
 In case users have a previous account in the terra, they can use their private key to generate an access token with the following `Parser` function. 
 ```ts
import generateTerraAccessToken = Parse.generateTerraAccessToken;

const accessToken = generateTerraAccessToken(wallet.privateKey);

    const anchorEarn = new AnchorEarn({
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
      accessToken: accessToken,
    });
```
## Examples
As mentioned above, `AnchorEarn` helps execute messages and query the state of the market and account. The following examples show how to use the object.
## Executor

`AnchorEarn` executor has three functionalities:
- deposit: deposit coin on anchor protocol
- withdraw: withdraw previously deposited amount.
- send: transfer `UST` and `AUST` to other accounts.

The following code snippets show how to use `AnchorEarn` object.

**NOTE**: currently anchor-earn supports `UST` currency.

### Deposit 
For depositing coins on Anchor Protocol, use the following example:
```ts
    const deposit = await anchorEarn.earn.deposit({
      amount: '...', // amount in natural decimal e.g. 100.5. The amount will be handled in macro.
      currency: DENOMS.UST,
    });
```

### Withdraw
To withdraw your deposits from the protocol, use the following example:
```ts
    const deposit = await anchorEarn.earn.withdraw({
      amount: '...', // amount in natural decimal e.g. 100.5. The amount will be handled in macro.
      currency: DENOMS.UST,
    });
```

### Send
To send `UST` and `AUST` to other accounts, use the following example: 
For this functionality, `AUst` denom is also supported. 
```ts
 const sendUst = await anchorEarn.earn.send(DENOMS.UST, {
      recipient: 'terra1....',
      amount: '...', // amount in natural decimal e.g. 100.5. The amount will be handled in macro.
    });
```
## Querier
`AnchorEarn` querier facilitates both querying the smart contracts and chain. There are two queries that the `AnchorEarn` object provides.
- balance: query user balance and user deposit amount based on currency.
- market: return the state of specifies currency market.

If a user wants to use queries alone, there is no need to instantiate the object like [here](#anchorearn-object); instead, the user can provide the address for queries like the following examples: 
### Balance
To get the current state of account, use the following example: 
```ts
 const anchorEarn = new AnchorEarn({
      chain: CHAIN.TERRA,
      network: NETWORKS.TESTNET,
    });

const userBalance = await anchorEarn.earn.balance({
      currencies: [DENOMS.UST],
      address: 'terra1...'
    });
```
### Market
To get the current state of the market, use the below example:
```ts
    const market = await anchorEarn.earn.market({
      currencies: [DENOMS.UST],
    });
```
## CustomSigner
Anchor-earn also facilitates a function that user can sign their transactions and leave the signed transaction to the SDK and SDK will manage to broadcast it.
 
 `CustomSigner` is a callback function that users can sign deposit, withdraw, and send transactions.
  
The following code snippet specifies an example of `CustomSigner` usage.

**Note**: address must be specified. 
```ts
const deposit = await anchorEarn.earn.deposit({
      amount: '0.01',
      currency: DENOMS.UST,
      customSigner: async (tx: Msg[]) => {
        const account = new MnemonicKey({
          mnemonic:
            '...',
        });

        const wallet = new Wallet(
          new LCDClient({
            URL: 'https://tequila-lcd.terra.dev',
            chainID: 'tequila-0004',
          }),
          account,
        );

        return await wallet.createAndSignTx({
          msgs: tx,
          gasAdjustment: 2,
          gasPrices: { uusd: 0.15 },
        });
      },
      address: 'terra1us9cs88cxhcqclusvs4lxw0pfesc8y6f44hr3u',
    });
```
## Loggable 
For seeing the progress of the transaction on the chain, loggable is provided. The following code shows how to use it:
```ts
    const deposit = await anchorEarn.earn.deposit({
      amount: '...',
      currency: DENOMS.UST,
      log: (data) => {
        console.log(data);
      }
    });
```
## License
This software is licensed under the Apache 2.0 license. Read more about it [here](./LICENSE).

© 2021 Anchor Protocol