# base stage with node and essentials
FROM node:15.14.0-alpine3.10 as deploy
WORKDIR /app
RUN apk add --no-cache python gcc g++ make git
COPY package.json /app/
COPY contracts /app/contracts
COPY hardhat.config.ts .
COPY scripts/deploy.ts .

RUN yarn
RUN yarn hardhat compile

ENTRYPOINT yarn hardhat run deploy.ts --network docker
