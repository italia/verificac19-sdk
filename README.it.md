# VerificaC19 SDK per Node.js

<a href="https://www.npmjs.com/package/verificac19-sdk"><img src="https://img.shields.io/npm/v/verificac19-sdk.svg?logo=npm" /></a>
<img src="https://github.com/italia/verificac19-sdk/actions/workflows/ci.yml/badge.svg" />
<a href="https://codecov.io/gh/italia/verificac19-sdk"><img src="https://codecov.io/gh/italia/verificac19-sdk/branch/master/graph/badge.svg?token=SZ7lyP073V"/></a>

Implementazione ufficiale per Node.js di VerificaC19 SDK ([lista degli SDK ufficiali](https://github.com/ministero-salute/it-dgc-verificac19-sdk-onboarding#lista-librerie)).

## Requisiti

- Node.js versione >= 12.x
- MongoDB versione >= 5.x (usato per memorizzare la CRL)

## Installazione

```sh
npm i verificac19-sdk
```

## Utilizzo

### Setup CRL environment

La CRL viene memorizzata su un database MongoDB. Questo repository fornisce un 
file `docker-compose.yml` (come istanza di sviluppo) con un replica set.

Di default la stringa di connessione è
`mongodb://root:example@localhost:27017/VC19?authSource=admin`, ed è possibile modificarla utilizzando la libreria integrata [dotenv](https://www.npmjs.com/package/dotenv), per fare ciò bisogna creare un file chiamato .env nella cartella di root e impostare il valore per la proprietà `VC19_MONGODB_URL`.

👉🏻  Vedi l'esempio [examples/.env](https://github.com/italia/verificac19-sdk/blob/master/examples/.env).

⚠️ Se non vuoi utilizzare MongoDB per gestire la CRL, 
leggi [come scrivere il proprio sistema di gestione CRL](https://github.com/italia/verificac19-sdk/blob/master/docs/it/CUSTOM_CRL.md).

### Scarica e salva regole, CRL e DSC

Puoi scaricare e salvare regole e DSC utilizzando il modulo `Service`.

```js
const {Service} = require('verificac19-sdk');

const main = async () => {
  await Service.updateAll();
}
```

⚠️ Regole e DSC vengono salvati di default nella cartella `.cache`, 
per cambiare questa impostazione occorre settare il valore `VC19_CACHE_FOLDER` nel file `.env`.

⏱ Di default `updateAll` può scaricare i nuovi dati ogni 24 ore.
Per cambiare questo valore, settare la variable `VC19_UPDATE_HOURS` nel file `.env`.

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

👉🏻 I metodi `fromImage` e `fromRaw` potrebbero sollevare l'eccezione 
`CertificateParsingError`.

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

| | Codice          | Descrizione                                   | Risultato |
|-| --------------- | --------------------------------------------- | --------- |
|✅| VALID           | Il certificato è valido                       | `true` |
|⚠️| TEST_NEEDED     | In modalità BOOSTER_DGP si necessita di test  | `false` |
|❌| NOT_VALID       | Il certificato non è valido                   | `false` |
|❌| NOT_VALID_YET   | Il certificato non è ancora valido            | `false` | 
|❌| REVOKED         | Il certificato è stato revocato               | `false` |
|❌| NOT_EU_DCC      | Il certificato non è un EU DCC                | `false` |

per esempio 

```js
const validationResult = await Validator.validate(dccTest);
console.log(validationResult.code === Validator.codes.NOT_VALID);
```

👉🏻 `validate` potrebbe sollevare l'eccezione `CertificateVerificationError` (ad
esempio quando la cache non è ancora pronta).

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
| VISITORS_RSA_DGP | RSA Visitors (ex verifica BOOSTER_DGP) | 

[DECRETO-LEGGE 4 febbraio 2022, n. 5](https://www.gazzettaufficiale.it/eli/id/2022/02/04/22G00014/sg)

### Metodi alternativi

Per scaricare e salvare le regole e le DSC puoi anche usare i metodi
`updateRules`, `updateSignaturesList` e `updateSignatures`.

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

Per validare un DCC puoi anche usare i metodi `Validator.checkRules` e 
`Validator.checkSignature`.

```js
const {Certificate, Validator} = require('verificac19-sdk');

const main = async () => {
  const myDCC = await Certificate.fromImage('./data/myDCC.png');
  const rulesOk = await Validator.checkRules(myDCC).result;
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
