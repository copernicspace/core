# Copernic EVM Solidity Smart Contracts

Implementation of digital asset management system in ethereum based smart contracts;

## Prerequisites



### NODE

node + npm\yarn

    # install is system specific
    # tip: use nvm 
    # https://github.com/nvm-sh/nvm

versions:

    node: >= vv15.14.0
    yarn: >= v1.22.10


### hardhad shorthand

https://hardhat.org/guides/shorthand.html

    yarn global add hardhat-shorthand

## KYC

For any user to accept space asset (ERC1155), his address has to be on KYC list; 
To add KYC address:

```
hh --network mumbai kycRegister:setStatus --kyc $KYC_ADDRESS --status true --client $USER_ADDRESS
```


## Cargo factory client

For any user to be able to create space cargo - his address has to be grantec client role on cargo factory contract;

To grant client role:

```
hh --network mumbai cargoFactory:addClient --factory $CARGO_FACTORY_ADDRESS --client $USER_ADDRESS
```

