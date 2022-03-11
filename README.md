# VerificaC19 SDK for Node.js

<a href="https://www.npmjs.com/package/verificac19-sdk"><img src="https://img.shields.io/npm/v/verificac19-sdk.svg?logo=npm" /></a>
<img src="https://github.com/italia/verificac19-sdk/actions/workflows/ci.yml/badge.svg" />
<a href="https://codecov.io/gh/italia/verificac19-sdk"><img src="https://codecov.io/gh/italia/verificac19-sdk/branch/master/graph/badge.svg?token=SZ7lyP073V"/></a>

Official VerificaC19 SDK implementation for Node.js ([official SDKs list](https://github.com/ministero-salute/it-dgc-verificac19-sdk-onboarding#lista-librerie)).

*Read this in other languages: [Italian 🇮🇹](https://github.com/italia/verificac19-sdk/blob/master/README.it.md).*

## Requirements

- Node.js version >= 12.x
- MongoDB version >= 5.x (used to store CRL)

## Installation

```sh
npm i verificac19-sdk
```

## Usage

### Setup CRL environment

CRL data will be stored in a MongoDB database. This repository provides a simple 
`docker-compose.yml` file (dev instance) with a replica set. By default the
connection string is `mongodb://root:example@localhost:27017/VC19?authSource=admin`.

If you want to change it as [dotenv](https://www.npmjs.com/package/dotenv) is used for environment variables managment, you must create a `.env` file in your root folder and set `VC19_MONGODB_URL` value.

👉🏻  See an example [examples/.env](https://github.com/italia/verificac19-sdk/blob/master/examples/.env).

⚠️ If you don't want to use MongoDB to store CRL, 
read [how to write your own CRL management system](https://github.com/italia/verificac19-sdk/blob/master/docs/en/CUSTOM_CRL.md).

### Download and cache rules, CRL data and DSCs

You can download and cache rules, CRL data and DSCs using `Service` module.

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.updateAll();
}
```

⚠️ By default rules and DSCs will be cached in a folder called `.cache`, 
to change it, set `VC19_CACHE_FOLDER` inside your `.env` file.

⏱ By default `updateAll` is allowed to fetch new data every 24 hours.
To change this value, set `VC19_UPDATE_HOURS` inside your `.env` file.

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
  exemptions: [ ... ],         // Array of exemptions (if any)
  vaccinations: [ ... ],       // Array of vaccinations (if any)
  tests: [ ... ],              // Array of tests (if any)
  recoveryStatements: [ ... ], // Array of recovery statements (if any)
  dcc: DCCObject               // from dcc-utils https://github.com/ministero-salute/dcc-utils
}
```

👉🏻 `fromImage` and `fromRaw` methods may rise `CertificateParsingError`.

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

| | Code            | Description                              | Result |
|-| --------------- | ---------------------------------------- | ------ |
|✅| VALID           | Certificate is valid                     | `true` |
|⚠️| TEST_NEEDED     | Test needed if verification mode is BOOSTER_DGP | `false` |
|❌| NOT_VALID       | Certificate is not valid                 | `false` |
|❌| NOT_VALID_YET   | Certificate is not valid yet             | `false` |
|❌| REVOKED   | Certificate is revoked           | `false` |
|❌| NOT_EU_DCC      | Certificate is not an EU DCC             | `false` |

for example 

```js
const validationResult = await Validator.validate(dccTest);
console.log(validationResult.code === Validator.codes.NOT_VALID);
```

👉🏻 `validate` method may rise `CertificateVerificationError` (e.g. when cache is
not ready yet).

👉🏻  See an example [examples/verifydccs.js](https://github.com/italia/verificac19-sdk/blob/master/examples/verifydccs.js).

### Verification mode

If you want to change verification mode and verify whether a certificate is a 
Super Green Pass or not, you need to pass `Validator.mode.SUPER_DGP` to 
`Validator.validate` method.

```js
const result = await Validator.validate(dcc, Validator.mode.SUPER_DGP);
```

| Code             | Description                              |
| ---------------- | ---------------------------------------- |
| NORMAL_DGP       | Normal verification (default value)      |
| SUPER_DGP        | Super Green Pass verification            | 
| VISITORS_RSA_DGP | RSA Visitors (ex BOOSTER_DGP verification mode) | 
| WORK_DGP | Work places verification | 
| ENTRY_IT_DGP | Entry in Italy verification | 

[DECRETO-LEGGE 4 febbraio 2022, n. 5](https://www.gazzettaufficiale.it/eli/id/2022/02/04/22G00014/sg)

### Alternative methods

To update rules and DSCs you can also use `updateRules`, 
`updateSignaturesList` and `updateSignatures` methods

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.setUp();
  await Service.updateRules();
  await Service.updateSignaturesList();
  await Service.updateSignatures();
  await Service.updateCRL();
  await Service.tearDown();
}
```

To verify a DCC you can also use `Validator.checkRules` and 
`Validator.checkSignature` methods.

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const rulesOk = await Validator.checkRules(myDCC).result;
  const signatureOk = await Validator.checkSignature(myDCC);
}
```

## Development

### Install dependencies

```sh
npm i
```

### Run tests

Run mongodb services using Docker

```sh
docker-compose up
```

Set `VC19_CACHE_FOLDER` and run tests

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
