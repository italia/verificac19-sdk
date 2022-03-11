const crypto = require('crypto');
const mongoose = require('mongoose');
const crl = require('./crl');
const { addHours } = require('./utils');

const UPDATE_WINDOW_HOURS = Number.parseInt(process.env.VC19_UPDATE_HOURS || '24', 10);

const CRL_MODEL = 'CRL';
const RULES_MODEL = 'RULES';
const SIGNATURES_MODEL = 'SIGNATURES';
const SIGNATURES_LIST_MODEL = 'SIGNATURELIST';

// * Modello timestamps https://mongoosejs.com/docs/guide.html#timestamps
// * Modello capped https://mongoosejs.com/docs/guide.html#capped

class MongoCache {
  async setUp(crlManager = crl) {
    // * Stringa di connessione al database
    this._dbConnection = await mongoose.createConnection(
      process.env.VC19_MONGODB_URL || 'mongodb://root:example@localhost:27017/VC19?authSource=admin',
    );

    // * Modello CRL
    this._crlModel = this._dbConnection.model(CRL_MODEL, new mongoose.Schema({
      chunk: { type: Number, default: 0 },
      totalChunk: { type: Number, default: 0 },
      version: { type: Number, default: 0 },
      targetVersion: { type: Number, default: 0 },
    }, {
      timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }));

    // * Modello Regole
    this._rulesModel = this._dbConnection.model(RULES_MODEL, new mongoose.Schema({
      data: String,
      b: String,
    }, {
      timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }));

    // * Modello Regole
    this._signaturesModel = this._dbConnection.model(SIGNATURES_MODEL, new mongoose.Schema({
      data: { type: String, default: '' },
    }, {
      timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }));

    // * Modello Regole
    this._signaturesListModel = this._dbConnection.model(SIGNATURES_LIST_MODEL, new mongoose.Schema({
      data: { type: String, default: '' },
    }, {
      timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }));

    if (this._crlManager) {
      await this._crlManager.tearDown();
    }
    if (crlManager) {
      this._crlManager = crlManager;
      await this._crlManager.setUp();
    }

    if (await this._crlModel.findOne() === null) {
      await this._crlModel().save();
    }

    if (await this._rulesModel.findOne() === null) {
      await this._rulesModel().save();
    }

    if (await this._signaturesModel.findOne() === null) {
      await this._signaturesModel().save();
    }

    if (await this._signaturesListModel.findOne() === null) {
      await this._signaturesListModel().save();
    }
  }

  async checkCacheManagerSetUp() {
    if (this._dbConnection) {
      await this.tearDown();
    }
    return this.setUp(this._crlManager);
  }

  async isReady() {
    if (this._dbConnection.readyState === 1) {
      const crlStatus = await this.getCRLStatus();
      return crlStatus.version !== 0 && crlStatus.completed;
    }
    return false;
  }

  async checkCrlManagerSetUp() {
    if (this._crlManager) {
      await this._crlManager.tearDown();
      return this._crlManager.setUp();
    }
    return this.setUp();
  }

  collectionNeedsUpdate(updatedAt, hours = UPDATE_WINDOW_HOURS) {
    try {
      if (addHours(updatedAt, hours) > new Date(Date.now())) {
        return false;
      }
    } catch {
      // Needs update
    }
    return true;
  }

  async storeCRLStatus(chunk = 0, totalChunk = 0, version = 0, targetVersion = 0) {
    await this._crlModel.updateOne(null, {
      chunk,
      totalChunk,
      version,
      targetVersion,
    });
  }

  async storeRules(data) {
    await this._rulesModel.updateOne(null, { data });
  }

  async storeSignaturesList(data) {
    await this._signaturesListModel.updateOne(null, {
      data,
    });
  }

  async storeSignatures(data) {
    await this._signaturesModel.updateOne(null, {
      data,
    });
  }

  async needCRLUpdate() {
    const data = await this.getCRLStatus();
    if (data.version === 0 || !data.completed) return true;
    return this.collectionNeedsUpdate(data.updated_at);
  }

  async needRulesUpdate() {
    const data = await this._rulesModel.findOne();
    return this.collectionNeedsUpdate(data.updated_at);
  }

  async needSignaturesUpdate() {
    const data = await this._signaturesModel.findOne();
    return this.collectionNeedsUpdate(data.updated_at);
  }

  async needSignaturesListUpdate() {
    const data = await this._signaturesListModel.findOne();
    return this.collectionNeedsUpdate(data.updated_at);
  }

  async getCRLStatus() {
    const crlStatus = await this._crlModel.findOne();
    crlStatus.completed = crlStatus.totalChunk === crlStatus.chunk;
    return crlStatus;
  }

  async getRules() {
    const data = await this._rulesModel.findOne();
    return JSON.parse(data.data);
  }

  async getSignatureList() {
    const data = await this._signaturesListModel.findOne();
    return JSON.parse(data.data);
  }

  async getSignatures() {
    const data = await this._signaturesModel.findOne();
    return JSON.parse(data.data);
  }

  async storeCRLRevokedUVCI(revokedUvci, deletedRevokedUvci) {
    await this.checkCrlManagerSetUp();
    await this._crlManager.storeRevokedUVCI(revokedUvci, deletedRevokedUvci);
    await this._crlManager.tearDown();
  }

  async isUVCIRevoked(uvci) {
    await this.checkCrlManagerSetUp();
    const transformedUVCI = crypto.createHash('sha256').update(uvci).digest('base64');
    const isRevoked = await this._crlManager.isUVCIRevoked(transformedUVCI);
    await this._crlManager.tearDown();
    return isRevoked;
  }

  async tearDown() {
    if (this._dbConnection) {
      await this._dbConnection.close();
      delete this._dbConnection.models[CRL_MODEL];
      delete this._dbConnection.models[RULES_MODEL];
      delete this._dbConnection.models[SIGNATURES_MODEL];
      delete this._dbConnection.models[SIGNATURES_LIST_MODEL];
      delete this._dbConnection.collection.clrs;
      delete this._dbConnection.collection.rules;
      delete this._dbConnection.collection.signaturelist;
      delete this._dbConnection.collection.signature;
      delete this._dbConnection.collection.uvcis;
      await this._dbConnection.deleteModel(/.+/);
      await mongoose.deleteModel(/.+/);
      this._dbConnection = null;
    }
    if (this._crlManager) {
      await this._crlManager.tearDown();
    }
  }

  async cleanCRL() {
    await this.checkCrlManagerSetUp();
    await this.storeCRLStatus();
    const cleanResult = await this._crlManager.clean();
    await this._crlManager.tearDown();
    return cleanResult;
  }
}

const cacheSingleton = new MongoCache();

module.exports = cacheSingleton;
