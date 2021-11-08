# VerificaC19 SDK for Node.js

<a href="https://www.npmjs.com/package/verificac19-sdk"><img src="https://img.shields.io/npm/v/verificac19-sdk.svg?logo=npm" /></a>
<img src="https://github.com/astagi/verificac19-sdk/actions/workflows/ci.yml/badge.svg" />
<a href="https://codecov.io/gh/astagi/verificac19-sdk"><img src="https://codecov.io/gh/astagi/verificac19-sdk/branch/master/graph/badge.svg?token=SZ7lyP073V"/></a>

VerificaC19 SDK implementation for Node.js.

## Installation (not available yet)

```sh
npm i verificac19-sdk
```

## Usage

### Download and cache rules and keys

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.updateRules();
  await Service.updateSignaturesList();
  await Service.updateSignatures();
}
```

⚠️ Default cache folder is `.cache`, to change it please set `VC19_CACHE_FOLDER`
env variable.

👉🏻  See an example [examples/syncdata.js](https://github.com/astagi/verificac19-sdk/blob/master/examples/syncdata.js).

### Verify a DCC

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const rulesOk = Validator.checkRules(myDCC);
  const signatureOk = await Validator.checkSignature(myDCC);
}
```

👉🏻  See an example [examples/verifydccs.js](https://github.com/astagi/verificac19-sdk/blob/master/examples/verifydccs.js).

## Development

Install dependencies

```sh
npm i
```

Run tests

```sh
npm run test
```

## Authors
Copyright (c) 2021 - Andrea Stagi

Parts of the core code have been written by [Area servizi ICT, Politecnico di Milano](https://www.ict.polimi.it/).

## License
VerificaC19-SDK for Node.js is available under the [MIT](https://opensource.org/licenses/mit-license.php) license.
