# Write your own CRL management system

By default CRL is managed using MongoDB database. If you don't want to use 
MongoDB, you can write your own CRL management system.

Create your CRL manager somewhere in your code (e.g. `crlmanager/index.js`) 
following this interface.

```js
class MyCRLManager {
  async setUp() {
    // Setup your deatabase
  }

  async storeRevokedUVCI(revokedUvci) {
    // Store `revokedUvci` elements
  }

  async isUVCIRevoked(uvci) {
    // Return true if `uvci` is present (UVCI revoked), false otherwise
  }

  async tearDown() {
    // Close your db, clean resources ...
  }

  async clean() {
    // Remove all data from db
  }
}
```

Then export your custom CRL as a singleton.

```js
const crlManager = new MyCRLManager();

module.exports = crlManager;
```

In order to make SDK using your custom CRL manager, set `VC19_CRL_ADAPTER_MODULE` 
with the name/path of your module (e.g. 'mycrladapter').

👉🏻  See an example [examples/crladapter/index.js](https://github.com/italia/verificac19-sdk/blob/master/examples/crladapter/index.js).

⚠️ The example above uses [Lowdb 1.0.0](https://github.com/typicode/lowdb), 
if you have large JavaScript objects (~10-100MB) you may hit some performance issues.
