# VerificaC19 SDK per Node.js

<a href="https://www.npmjs.com/package/verificac19-sdk"><img src="https://img.shields.io/npm/v/verificac19-sdk.svg?logo=npm" /></a>
<img src="https://github.com/italia/verificac19-sdk/actions/workflows/ci.yml/badge.svg" />
<a href="https://codecov.io/gh/italia/verificac19-sdk"><img src="https://codecov.io/gh/italia/verificac19-sdk/branch/master/graph/badge.svg?token=SZ7lyP073V"/></a>

Implementazione ufficiale per Node.js di VerificaC19 SDK ([lista degli SDK ufficiali](https://github.com/ministero-salute/it-dgc-verificac19-sdk-onboarding#lista-librerie)).

## Requisiti

- Node.js versione >= 12.x

## Installazione

```sh
npm i verificac19-sdk
```

## Utilizzo

### Scarica e salva regole e DSC

Puoi scaricare e salvare regole e DSC utilizzando il modulo `Service`.

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.updateAll();
}
```

⚠️ Regole e DSC vengono salvati di default nella cartella `.cache`, 
per cambiare questa impostazione occorre settare la variabile di ambiente `VC19_CACHE_FOLDER`.

👉🏻  Vedi l'esempio [examples/syncdata.js](https://github.com/italia/verificac19-sdk/blob/master/examples/syncdata.js).

### Verifica un DCC

Puoi caricare un DCC da un'immagine o da una stringa usando il modulo `Certificate`.

```js
const {Certificate} = require('verificac19-sdk');

const main = async () => {
  const myDCCfromImage = await Certificate.fromImage('./data/myDCC.png');
  const myDCCfromRaw = await Certificate.fromRaw('HC1:6BF+70790T9WJWG.FKY*4GO0.O1CV2...etc..');
}
```

Il contenuto del DCC caricato sarà il seguente:

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

Puoi verificare un DCC utilizzando il modulo `Validator`.

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const validationResult = await Validator.validate(myDCC);
}
```

`Validator.validate` torna un oggetto contenente il nome della persona `person`,
`date_of_birth`, `code` e `message` insieme al risultato (`result`)

```js
{
  person: 'Erika Mustermann',
  date_of_birth: '1964-08-12',
  code: 'NOT_VALID',
  result: false,
  message: 'Test Result is expired at : 2021-05-22T12:34:56.000Z'
}
```

Puoi comparare `code` con i valori di `Validator.codes` riportati nella tabella

| | Code            | Description                                   |
|-| --------------- | --------------------------------------------- |
|✅| VALID           | Il certificato è valido in Italia e in Europa |
|✅| PARTIALLY_VALID | Il certificato è valido solo in Italia        | 
|❌| NOT_VALID       | Il certificato non è valido                   | 
|❌| NOT_VALID_YET   | Il certificato non è ancora valido            | 
|❌| NOT_EU_DCC      | Il certificato non è un EU DCC                | 

per esempio 

```js
const validationResult = await Validator.validate(dccTest);
console.log(validationResult.code === Validator.codes.NOT_VALID);
```

👉🏻  Vedi l'esempio [examples/verifydccs.js](https://github.com/italia/verificac19-sdk/blob/master/examples/verifydccs.js).

### Modalità di verifica

Se vuoi cambiare la modalità di verifica e verificare se il certificato è un 
Super Green Pass o meno, devi passare il valore `Validator.mode.SUPER_DGP` al
metodo `Validator.validate`.

```js
const result = await Validator.validate(dcc, Validator.mode.SUPER_DGP);
```

| Codice         | Descrizione                              |
| -------------- | ---------------------------------------- |
| NORMAL_DGP     | Verifica normale (valore di default)     |
| SUPER_DGP      | Verifica Super Green Pass                | 

***Il Super Green Pass, che entrerà in vigore dal 6 dicembre al 15 gennaio 2021,
sarà un certificato valido solo per le persone che sono state vaccinate 
o che sono guarite dal Covid19, e impedirà a tutti gli altri di entrare nei bar,
ristoranti, cinema, palestre, teatri, discoteche e stadi.***

### Metodi alternativi

Per scaricare e salvare le regole e le DSC puoi anche usare i metodi
`updateRules`, `updateSignaturesList` e `updateSignatures`.

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.updateRules();
  await Service.updateSignaturesList();
  await Service.updateSignatures();
}
```

Per validare un DCC puoi anche usare i metodi `Validator.checkRules` e 
`Validator.checkSignature`.

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const rulesOk = Validator.checkRules(myDCC).result;
  const signatureOk = await Validator.checkSignature(myDCC);
}
```

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

## Contributori

<a href="https://github.com/italia/verificac19-sdk">
  <img
  src="https://contributors-img.web.app/image?repo=italia/verificac19-sdk"
  />
</a>

## Licenza
VerificaC19-SDK per Node.js è disponibile sotto licenza [MIT](https://opensource.org/licenses/mit-license.php).
