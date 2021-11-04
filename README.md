# VerificaC19 Node.js SDK

## Installation (not available yet)

```sh
npm i verificac19-sdk
```

## Usage

Download and cache rules and keys

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

Verify a DCC

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const rulesOk = Validator.checkRules(myDCC);
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

## License

Area servizi ICT del Politecnico di Milano
