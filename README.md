# Copernic Core

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

    hh test

## hh scripts&tasks
this are useful hardhat examples;

'mumbai' is default in all examples, because it is testnet. 
'polygon' is an alias for mainnet. Change via `--network` option in `hh`


to use those, setup `secret.ts` file in root of the project. example:

```
const MUMBAI_ALCHEMY_API = ''
const MUMBAI_SEED = ''

const POLYGON_ALCHEMY_API = ''
const POLYGON_SEED = ''

export { MUMBAI_ALCHEMY_API, MUMBAI_SEED, POLYGON_ALCHEMY_API, POLYGON_SEED }
```


### SpaceMart 
#### KYC

For any user to accept space asset (ERC1155), his address has to be on KYC list; 
To add KYC address:

    hh --network mumbai kycRegister:setStatus --kyc $KYC_ADDRESS --status true --client $USER_ADDRESS

#### Payload factory client

For any user to be able to create space payload - his address has to be granted client role on payload factory contract;

To grant client role:

```
hh --network mumbai payloadFactory:addClient --factory $PAYLOAD_FACTORY_ADDRESS --client $USER_ADDRESS
```

### Spaceibles

#### deploy asset 
    hh --network polygon run scripts/spaceibles/asset.deploy.ts