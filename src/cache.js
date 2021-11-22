const fs = require('fs');
const path = require('path');
const { addHours } = require('./utils');

const CACHE_FOLDER = process.env.VC19_CACHE_FOLDER || '.cache';
const RULES_FILE = 'rules.json';
const SIGNATURES_LIST_FILE = 'signatureslist.json';
const SIGNATURES_FILE = 'signatures.json';

const SIGNATURES_FILE_PATH = path.join(CACHE_FOLDER, SIGNATURES_FILE);
const RULES_FILE_PATH = path.join(CACHE_FOLDER, RULES_FILE);
const SIGNATURES_LIST_FILE_PATH = path.join(CACHE_FOLDER, SIGNATURES_LIST_FILE);

const UPDATE_WINDOW_HOURS = 24;

const fileNeedsUpdate = (filePath) => {
  try {
    if (addHours(fs.statSync(filePath).mtime, UPDATE_WINDOW_HOURS) > new Date(Date.now())) {
      return false;
    }
  } catch (err) {
    // Needs update
  }
  return true;
};

const setUp = () => {
  fs.promises.mkdir(CACHE_FOLDER, { recursive: true });
};

const storeRules = (data) => {
  fs.writeFileSync(RULES_FILE_PATH, data);
};

const storeSignaturesList = (data) => {
  fs.writeFileSync(SIGNATURES_LIST_FILE_PATH, data);
};

const storeSignatures = (data) => {
  fs.writeFileSync(SIGNATURES_FILE_PATH, data);
};

const needRulesUpdate = () => fileNeedsUpdate(RULES_FILE_PATH);

const needSignaturesUpdate = () => fileNeedsUpdate(SIGNATURES_FILE_PATH);

const needSignaturesListUpdate = () => fileNeedsUpdate(SIGNATURES_LIST_FILE_PATH);

const getRules = () => JSON.parse(fs.readFileSync(path.join(CACHE_FOLDER, RULES_FILE)));

const getSignatureList = () => JSON.parse(fs.readFileSync(path.join(CACHE_FOLDER, SIGNATURES_LIST_FILE)));

const getSignatures = () => JSON.parse(fs.readFileSync(path.join(CACHE_FOLDER, SIGNATURES_FILE)));

module.exports = {
  setUp,
  storeRules,
  storeSignaturesList,
  storeSignatures,
  getRules,
  getSignatureList,
  getSignatures,
  needRulesUpdate,
  needSignaturesListUpdate,
  needSignaturesUpdate,
};
