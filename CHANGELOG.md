# CHANGELOG

## v1.0.1
> 12 May 2021
  
  Here is the [release](https://github.com/Anchor-Protocol/anchor-earn/commit/ff6a7a71d682876f8a8792135ebde1a2876736e9).
### Added:
 - Fix `operationHandler` function to support only `Msg[]`.
  
 
## v1.0.0
> 10 May 2021
  
  First [release](https://github.com/Anchor-Protocol/anchor-earn/commit/f30c8a580e23d07669c9b876078112e7c34ec5c1)
### Features:
 - Supports only Terra blockchain.   
 - Works with both Testnet(tequila-004) and Main-net(columbus-4) Anchor protocol contracts.
 - Supports deposit, withdraw, send execution functionality.
    - Supports deposit in TerraUSD(UST) currency.
    - Supports withdraw in both TerraUSD(UST) and aUST currency.
    - Supports send in TerraUSD(UST) and aUST.
    
 - Supports market and user state queries.
 - Supports customSigner, customBroadcaster, loggable.