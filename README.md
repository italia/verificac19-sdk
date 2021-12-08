# VerificaC19 SDK for Node.js

<a href="https://www.npmjs.com/package/verificac19-sdk"><img src="https://img.shields.io/npm/v/verificac19-sdk.svg?logo=npm" /></a>
<img src="https://github.com/italia/verificac19-sdk/actions/workflows/ci.yml/badge.svg" />
<a href="https://codecov.io/gh/italia/verificac19-sdk"><img src="https://codecov.io/gh/italia/verificac19-sdk/branch/master/graph/badge.svg?token=SZ7lyP073V"/></a>

Official VerificaC19 SDK implementation for Node.js ([official SDKs list](https://github.com/ministero-salute/it-dgc-verificac19-sdk-onboarding#lista-librerie)).

*Read this in other languages: [Italian 🇮🇹](https://github.com/italia/verificac19-sdk/blob/master/README.it.md).*

## Requirements

- Node.js version >= 12.x

## Installation

```sh
npm i verificac19-sdk
```

## Usage

### Download and cache rules and DSCs

You can download and cache rules and DSCs using `Service` module.

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.updateAll();
}
```

⚠️ By default rules and DSCs will be cached in a folder called `.cache`, 
to change it please set `VC19_CACHE_FOLDER` env variable.

👉🏻  See an example [examples/syncdata.js](https://github.com/italia/verificac19-sdk/blob/master/examples/syncdata.js).

### Verify a DCC

You can load a DCC from an image or from a raw string using `Certificate` module.

```js
const {Certificate} = require('verificac19-sdk');

const main = async () => {
  const myDCCfromImage = await Certificate.fromImage('./data/myDCC.png');
  const myDCCfromRaw = await Certificate.fromRaw('HC1:6BF+70790T9WJWG.FKY*4GO0.O1CV2...etc..');
}
```

Loaded DCC has the following structure:

```js
{
  person: {
    standardisedFamilyName: 'MUSTERMANN',
    familyName: 'Mustermann',
    standardisedGivenName: 'ERIKA',
    givenName: 'Erika'
  },
  dateOfBirth: '1964-08-12',
  kid: 'TH15154F4k3K1D=',
  vaccinations: [ ... ],       // Array of vaccinations (if any)
  tests: [ ... ],              // Array of tests (if any)
  recoveryStatements: [ ... ], // Array of recovery statements (if any)
  dcc: DCCObject               // from dcc-utils https://github.com/ministero-salute/dcc-utils
}
```

You can verify a DCC using `Validator` module.

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const validationResult = await Validator.validate(myDCC);
}
```

`Validator.validate` returns an object containing `person` name, 
`date_of_birth`, `code` and a `message` alongside the `result`

```js
{
  person: 'Erika Mustermann',
  date_of_birth: '1964-08-12',
  code: 'NOT_VALID',
  result: false,
  message: 'Test Result is expired at : 2021-05-22T12:34:56.000Z'
}
```

you can compare the resulting `code` with `Validator.codes` values

| | Code            | Description                              |
|-| --------------- | ---------------------------------------- |
|✅| VALID           | Certificate is valid in Italy and Europe |
|✅| PARTIALLY_VALID | Certificate is valid only in Italy       | 
|❌| NOT_VALID       | Certificate is not valid                 | 
|❌| NOT_VALID_YET   | Certificate is not valid yet             | 
|❌| NOT_EU_DCC      | Certificate is not an EU DCC             | 

for example 

```js
const validationResult = await Validator.validate(dccTest);
console.log(validationResult.code === Validator.codes.NOT_VALID);
```

👉🏻  See an example [examples/verifydccs.js](https://github.com/italia/verificac19-sdk/blob/master/examples/verifydccs.js).


### Verification mode

If you want to change verification mode and verify whether a certificate is a 
Super Green Pass or not, you need to pass `Validator.mode.SUPER_DGP` to 
`Validator.validate` method.

```js
const result = await Validator.validate(dcc, Validator.mode.SUPER_DGP);
```

| Code           | Description                              |
| -------------- | ---------------------------------------- |
| NORMAL_DGP     | Normal verification (default value)      |
| SUPER_DGP      | Super Green Pass verification            | 

***Super Green Pass, which will come into force from 6 December to 15 January 2021, 
will be a certificate valid only for people who have been vaccinated against 
or who have recovered from Covid19, and will prevent all the others from 
entering bars, restaurants, cinemas, gyms, theatres, discos and stadiums.***

### Alternative methods

To update rules and DSCs you can also use `updateRules`, 
`updateSignaturesList` and `updateSignatures` methods

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.updateRules();
  await Service.updateSignaturesList();
  await Service.updateSignatures();
}
```

To verify a DCC you can also use `Validator.checkRules` and 
`Validator.checkSignature` methods.

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const rulesOk = Validator.checkRules(myDCC).result;
  const signatureOk = await Validator.checkSignature(myDCC);
}
```

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

## Contributors
Here is a list of contributors. Thank you to everyone involved for improving this project, day by day.

<a href="https://github.com/italia/verificac19-sdk">
  <img
  src="https://contributors-img.web.app/image?repo=italia/verificac19-sdk"
  />
</a>

## License
VerificaC19-SDK for Node.js is available under the [MIT](https://opensource.org/licenses/mit-license.php) license.
