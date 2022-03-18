const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const crl = require('./crl');
const { addHours } = require('./utils');

const CACHE_FOLDER = process.env.VC19_CACHE_FOLDER || '.cache';
const CRL_FILE = 'crl.json';
const RULES_FILE = 'rules.json';
const SIGNATURES_LIST_FILE = 'signatureslist.json';
const SIGNATURES_FILE = 'signatures.json';

const CRL_FILE_PATH = path.join(CACHE_FOLDER, CRL_FILE);
const SIGNATURES_FILE_PATH = path.join(CACHE_FOLDER, SIGNATURES_FILE);
const RULES_FILE_PATH = path.join(CACHE_FOLDER, RULES_FILE);
const SIGNATURES_LIST_FILE_PATH = path.join(CACHE_FOLDER, SIGNATURES_LIST_FILE);

const UPDATE_WINDOW_HOURS = Number.parseInt(process.env.VC19_UPDATE_HOURS || '24', 10);

class FileCache {
  async setUp(crlManager = crl) {
    this.identifier = 'filecache';

    fs.mkdirSync(CACHE_FOLDER, { recursive: true });
    if (!fs.existsSync(CRL_FILE_PATH)) {
      fs.writeFileSync(CRL_FILE_PATH, JSON.stringify({
        chunk: 0, totalChunk: 0, version: 0, targetVersion: 0,
      }));
    }
    if (this._crlManager) {
      await this._crlManager.tearDown();
    }
    if (crlManager) {
      this._crlManager = crlManager;
      await this._crlManager.setUp();
    }
  }

  async isReady() {
    for (const file of [CRL_FILE_PATH, SIGNATURES_FILE_PATH, RULES_FILE_PATH, SIGNATURES_LIST_FILE_PATH]) {
      if (!fs.existsSync(file)) {
        return false;
      }
    }
    const crlStatus = await this.getCRLStatus();
    return crlStatus.version !== 0 && crlStatus.completed;
  }

  async checkCacheManagerSetUp() {
    return true;
  }

  async checkCrlManagerSetUp() {
    if (this._crlManager) {
      await this._crlManager.tearDown();
      return this._crlManager.setUp();
    }
    return this.setUp();
  }

  fileNeedsUpdate(filePath, hours = UPDATE_WINDOW_HOURS) {
    try {
      if (addHours(fs.statSync(filePath).mtime, hours) > new Date(Date.now())) {
        return false;
      }
    } catch {
      // Needs update
    }
    return true;
  }

  async storeCRLStatus(chunk = 0, totalChunk = 0, version = 0, targetVersion = 0) {
    fs.writeFileSync(CRL_FILE_PATH, JSON.stringify({
      chunk, totalChunk, version, targetVersion,
    }));
  }

  async storeRules(data) {
    fs.writeFileSync(RULES_FILE_PATH, data);
  }

  async storeSignaturesList(data) {
    fs.writeFileSync(SIGNATURES_LIST_FILE_PATH, data);
  }

  async storeSignatures(data) {
    fs.writeFileSync(SIGNATURES_FILE_PATH, data);
  }

  needCRLUpdate() {
    const crlStatus = this.getCRLStatus();
    if (crlStatus.version === 0 || !crlStatus.completed) return true;
    return this.fileNeedsUpdate(CRL_FILE_PATH, UPDATE_WINDOW_HOURS);
  }

  needRulesUpdate() {
    return this.fileNeedsUpdate(RULES_FILE_PATH);
  }

  needSignaturesUpdate() {
    return this.fileNeedsUpdate(SIGNATURES_FILE_PATH);
  }

  needSignaturesListUpdate() {
    return this.fileNeedsUpdate(SIGNATURES_LIST_FILE_PATH);
  }

  async getCRLStatus() {
    const crlStatus = JSON.parse(fs.readFileSync(CRL_FILE_PATH));
    crlStatus.completed = crlStatus.totalChunk === crlStatus.chunk;
    return crlStatus;
  }

  async getRules() {
    return JSON.parse(fs.readFileSync(RULES_FILE_PATH));
  }

  async getSignatureList() {
    return JSON.parse(fs.readFileSync(SIGNATURES_LIST_FILE_PATH));
  }

  async getSignatures() {
    return JSON.parse(fs.readFileSync(SIGNATURES_FILE_PATH));
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
    if (this._crlManager) {
      await this._crlManager.tearDown();
    }
  }

  async cleanAll() {
    await this.cleanRules();
    await this.cleanSignatures();
    await this.cleanSignaturesList();
    await this.cleanCRL();
  }

  async cleanRules() {
    if (fs.existsSync(RULES_FILE_PATH)) {
      fs.unlinkSync(RULES_FILE_PATH);
    }
  }

  async cleanSignatures() {
    if (fs.existsSync(SIGNATURES_FILE_PATH)) {
      fs.unlinkSync(SIGNATURES_FILE_PATH);
    }
  }

  async cleanSignaturesList() {
    if (fs.existsSync(SIGNATURES_LIST_FILE_PATH)) {
      fs.unlinkSync(SIGNATURES_LIST_FILE_PATH);
    }
  }

  async cleanCRL() {
    await this.checkCrlManagerSetUp();
    fs.writeFileSync(CRL_FILE_PATH, JSON.stringify({
      chunk: 0, totalChunk: 0, version: 0, targetVersion: 0,
    }));
    const cleanResult = await this._crlManager.clean();
    await this._crlManager.tearDown();
    return cleanResult;
  }
}

module.exports = FileCache;
