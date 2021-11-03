const fs = require('fs');
const path = require('path');

const CACHE_FOLDER = process.env.VC19_CACHE_FOLDER || '.cache';
const RULES_FILE = 'rules.json';
const SIGNATURES_LIST_FILE = 'signatureslist.json';
const SIGNATURES_FILE = 'signatures.json';

const setUp = () => {
  fs.promises.mkdir(CACHE_FOLDER, { recursive: true });
};

const storeRules = (data) => {
  fs.writeFileSync(path.join(CACHE_FOLDER, RULES_FILE), data);
};

const storeSignatureList = (data) => {
  fs.writeFileSync(path.join(CACHE_FOLDER, SIGNATURES_LIST_FILE), data);
};

const storeSignatures = (data) => {
  fs.writeFile(path.join(CACHE_FOLDER, SIGNATURES_FILE), data);
};

const getRules = () => JSON.parse(fs.readFileSync(path.join(CACHE_FOLDER, RULES_FILE)));

const getSignatureList = () => JSON.parse(fs.readFileSync(path.join(CACHE_FOLDER, SIGNATURES_LIST_FILE)));

const getSignatures = () => JSON.parse(fs.readFileSync(path.join(CACHE_FOLDER, SIGNATURES_FILE)));

module.exports = {
  setUp,
  storeRules,
  storeSignatureList,
  storeSignatures,
  getRules,
  getSignatureList,
  getSignatures,
};
