# VerificaC19 SDK per Node.js

<a href="https://www.npmjs.com/package/verificac19-sdk"><img src="https://img.shields.io/npm/v/verificac19-sdk.svg?logo=npm" /></a>
<img src="https://github.com/astagi/verificac19-sdk/actions/workflows/ci.yml/badge.svg" />
<a href="https://codecov.io/gh/astagi/verificac19-sdk"><img src="https://codecov.io/gh/astagi/verificac19-sdk/branch/master/graph/badge.svg?token=SZ7lyP073V"/></a>

Implementazione per Node.js di VerificaC19 SDK.

## Installazione

```sh
npm i verificac19-sdk
```

## Utilizzo

### Scarica e salva regole e chiavi

Puoi scaricare e salvare regole e chiavi utilizzando il modulo `Service`.

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.updateAll();
}
```

In alternativa puoi scaricare e salvare le regole e le chiavi utilizzando gli opportuni metodi singoli.

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.updateRules();
  await Service.updateSignaturesList();
  await Service.updateSignatures();
}
```

⚠️ Regole e chiavi vengono salvati di default nella cartella `.cache`, 
per cambiare questa impostazione occorre settare la variabile di ambiente `VC19_CACHE_FOLDER`.

👉🏻  Vedi l'esempio [examples/syncdata.js](https://github.com/astagi/verificac19-sdk/blob/master/examples/syncdata.js).

### Verifica un DCC

Puoi verificare un DCC utilizzando i moduli `Certificate` e `Validator`.

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const rulesOk = Validator.checkRules(myDCC).result;
  const signatureOk = await Validator.checkSignature(myDCC);
}
```

Il metodo `checkRules` torna un oggetto contenente `code` e `message` insieme al risultato (`result`)

```js
{
  result: false,
  code: 'NOT_VALID',
  message: 'Test Result is expired at : 2021-05-22T12:34:56.000Z'
}
```

Puoi comparare `code` con i valori di `Validator.codes` riportati nella tabella

| | Code            | Description                                   |
|-| --------------- | --------------------------------------------- |
|✅| VALID           | Il certificato è valido in Italia e in Europa |
|🔵| PARTIALLY_VALID | Il certificato è valido solo in Italia        | 
|❌| NOT_VALID       | Il certificato non è valido                   | 
|❌| NOT_VALID_YET   | Il certificato non è ancora valido            | 
|❌| NOT_EU_DCC      | Il certificato non è un EU DCC                | 

per esempio 

```js
const rulesSummary = Validator.checkRules(dccTest);
console.log(rulesSummary.code === Validator.codes.NOT_VALID);
```

👉🏻  Vedi l'esempio [examples/verifydccs.js](https://github.com/astagi/verificac19-sdk/blob/master/examples/verifydccs.js).

## Development

Installa le dipendenze con

```sh
npm i
```

Lancia i test

```sh
npm run test
```

## Autori
Copyright (c) 2021 - Andrea Stagi

Parte del codice principale è stata scritta da [Area servizi ICT, Politecnico di Milano](https://www.ict.polimi.it/).

## Licenza
VerificaC19-SDK per Node.js è disponibile sotto la licenza [MIT](https://opensource.org/licenses/mit-license.php).
