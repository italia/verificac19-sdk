# Scrivi il tuo sistema di gestione CRL

Di default la CRL viene gestito utilizzando il database MongoDB. Se non vuoi usare
MongoDB, puoi scrivere il tuo sistema di gestione CRL.

Crea il tuo sistema di gestione CRL (e.g. `crlmanager/index.js`) 
seguendo questa interfaccia.

```js
class MyCRLManager {
  async setUp() {
    // Fai setup del tuo database
  }

  async storeRevokedUVCI(revokedUvci = [], deletedRevokedUvci = []) {
    // Memorizza gli elementi `revokedUvci` e rimuove quelli in `deletedRevokedUvci` 
  }

  async isUVCIRevoked(uvci) {
    // Restituisce `true` se l' `uvci` è presente (UVCI revocato), `false` altrimenti
  }

  async clean() {
    // Rimuovi tutti i dati dal database
  }

  async tearDown() {
    // Chiudi il tuo database, pulisci le risorse ...
  }
}
```

Esporta un'istanza come singleton.

```js
const crlManager = new MyCRLManager();

module.exports = crlManager;
```

E per far sì che VerificaC19 SDK utilizzi il tuo sistema di gestione CRL

```js
const { Service } = require('verificac19-sdk');
const crlManager = require('./crlmanager');

await Service.updateAll(crlManager);
```

👉🏻 Puoi anche utilizzare il metodo `Service.setUp` , 
vedi ad esempio [examples/crlmanager.js](https://github.com/italia/verificac19-sdk/blob/master/examples/crlmanager.js).

⚠️ L'esempio sopra utilizza [Lowdb 1.0.0](https://github.com/typicode/lowdb), 
per oggetti JS molto grandi (~10-100MB) puoi incorrere in alcuni problemi di
performance.
