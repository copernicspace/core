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

### install node dependencies
> yarn

## test
>  yarn test

## dev env
Start ganache based network and deploy contracts;

### ganache
note: is stateless

>docker run --name copernic-ganache-dev --rm -d -p 8545:8545 trufflesuite/ganache-cli:latest --deterministic

note: access logs via:
> docker logs -f copernic-ganache-dev

### deploy contracts
> yarn dev

### docker deploy contracts

> docker-compose up

