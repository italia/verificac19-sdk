const Database = require('better-sqlite3');

class SqliteCrlManager {
  async setUp() {
    this._db = new Database('crl.db');
    await this._db.exec('CREATE TABLE IF NOT EXISTS ucvi (revokedUcvi VARCHAR PRIMARY KEY)');
  }

  async storeRevokedUVCI(revokedUvci) {
    const stmt = this._db.prepare(`INSERT OR IGNORE INTO ucvi(revokedUcvi) VALUES ${revokedUvci.map(() => '(?)').join(',')}`);
    await stmt.run(revokedUvci);
  }

  async isUVCIRevoked(uvci) {
    const stmt = this._db.prepare('SELECT revokedUcvi FROM ucvi WHERE revokedUcvi = ?');
    const result = await stmt.get(uvci);
    return !!(result);
  }

  async tearDown() {
    return this._db.close();
  }

  async clean() {
    return this._db.exec('DROP TABLE IF EXISTS ucvi');
  }
}

const crlManager = new SqliteCrlManager();
module.exports = crlManager;
