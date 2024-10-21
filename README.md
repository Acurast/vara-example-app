<h2 align="center">Acurast Deployment for Vara L2-integration</h2>

<p align="center">
  <em>
    Deploy your NodeJS app to the Acurast Decentralized Serverless Cloud and submit to a smart contract deployed on Vara
  </em>
</p>

<p align="center">
  <a href="https://twitter.com/Acurast">
    <img alt="Follow Acurast on Twitter" src="https://img.shields.io/badge/%40Acurast-9f9f9f?style=flat-square&logo=x&labelColor=555"></a>
</p>

This repository contains an example deployment that runs on the _Acurast Decentralized Serverless Cloud_ and submits to a smart contract deployed to [Vara](https://vara.network/), written in [gear](https://gear-tech.io/).

To learn more about Acurast please visit the [website](https://acurast.com/) and [documentation](https://docs.acurast.com/).
To learn more about Vara please visit the [website](https://vara.network/).

## Installation

Choose a node version that is compatible with Acurast Cloud; we use [nvm](https://github.com/nvm-sh/nvm) to switch to different node versions:

```sh
nvm use 18
```

```sh
yarn install
```

If you updated the [idl](./src/vara_proxy.idl)] for the proxy, run this to update the generated client [lib](./src/lib.ts):
```sh
npx sails-js-cli generate ./src/vara_proxy.idl -o src/ --no-project
```

## Usage

Change the code in `src/` as you wish, keeping the fulfillment contract call. This example just submits a text to the _consumer_ smart contract, using the Acurast proxy contract as an intermediary. Details of this contracts (written in [gear](https://gear-tech.io/)):

- **Consumer contract** [source](https://github.com/gear-foundation/dapps/tree/master/contracts/ping)
- **Acurast Proxy contract** [[source](https://github.com/Acurast/acurast-substrate/tree/develop/hyperdrive/vara/vara-proxy) | [idl](./src/vara_proxy.idl)]: receiving the submission over the `fulfill` message (and handling the rest of L2-integration protocol).



Build and bundle the source files in `src/` to a single JavaScript file in `dist/index.js`: 

```sh
yarn build
```

*NOTE*: you can run `yarn start` to check the bundling succeeded but you will see errors that the `_STD_` global variable is not present since this is only available on Acurast processors.

You can copy the content of `dist/index.js` to the script form field in the [Acurast Console](https://console.acurast.com/).

Alternatively use the [Acurast CLI](https://github.com/Acurast/acurast-cli) to deploy the job:

```sh
acurast deploy
```

It will eventually print the ipfs URL you can enter directly in the [Acurast Console](https://console.acurast.com/).
