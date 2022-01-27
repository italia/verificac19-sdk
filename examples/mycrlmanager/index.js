const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

class MyCRLManager {
  async setUp() {
    const adapter = new FileSync(process.env.VC19_CRL_DB || 'crldb.json');
    this._db = low(adapter);
    await this._db.defaults({ uvcis: [] }).write();
  }

  async storeRevokedUVCI(revokedUvci) {
    await this._db.get('uvcis').push(...revokedUvci).write();
  }

  async isUVCIRevoked(uvci) {
    return !await this._db.get('uvcis').find(uvci);
  }

  async tearDown() {
    // Do nothing
  }

  async clean() {
    return this._db.set('uvcis', []).write();
  }
}

const crlSingleton = new MyCRLManager();

module.exports = crlSingleton;
