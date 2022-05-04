# Copernic EVM Solidity Smart Contracts

Implementation of digital asset management system in ethereum based smart contracts;

## Prerequisites

### NODE


node + npm\yarn

    # install is system specific
    # tip: use nvm 

 https://github.com/nvm-sh/nvm

versions:

    node: >= vv15.14.0
    yarn: >= v1.22.10


### hardhat shorthand

https://hardhat.org/guides/shorthand.html

    yarn global add hardhat-shorthand

## Tests

```
hh test
```

## Contract interactions

### KYC

For any user to accept space asset (ERC1155), his address has to be on KYC list; 
To add KYC address:

```
hh --network mumbai kycRegister:setStatus --kyc $ `KYC_ADDRESS --status true --client $USER_ADDRESS
```

### Payload factory client

For any user to be able to create space payload - his address has to be granted client role on payload factory contract;

To grant client role:

```
hh --network mumbai payloadFactory:addClient --factory $PAYLOAD_FACTORY_ADDRESS --client $USER_ADDRESS
```

