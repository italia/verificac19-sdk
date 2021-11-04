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

```

## License
