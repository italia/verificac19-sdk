# VerificaC19 SDK for Node.js

<a href="https://www.npmjs.com/package/verificac19-sdk"><img src="https://img.shields.io/npm/v/verificac19-sdk.svg?logo=npm" /></a>
<img src="https://github.com/astagi/verificac19-sdk/actions/workflows/ci.yml/badge.svg" />
<a href="https://codecov.io/gh/astagi/verificac19-sdk"><img src="https://codecov.io/gh/astagi/verificac19-sdk/branch/master/graph/badge.svg?token=SZ7lyP073V"/></a>

VerificaC19 SDK implementation for Node.js.

## Installation

```sh
npm i verificac19-sdk
```

## Usage

### Download and cache rules and keys

You can download and cache rules and keys using `Service`.

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

You can verify a DCC using `Certificate` and `Validator`.

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const rulesOk = Validator.checkRules(myDCC).result;
  const signatureOk = await Validator.checkSignature(myDCC);
}
```

`checkRules` method returns an object containing a `code` and a `message` alongside the `result`

```js
{
  result: false,
  code: 'NOT_VALID',
  message: 'Test Result is expired at : 2021-05-22T12:34:56.000Z'
}
```

you can compare the resulting `code` with `Validator.codes` values

```js
VALID
PARTIALLY_VALID
NOT_VALID
NOT_VALID_YET
NOT_GREEN_PASS
```

for example 

```js
const rulesSummary = Validator.checkRules(dccTest);
console.log(rulesSummary.code === Validator.codes.NOT_VALID);
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
