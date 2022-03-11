require('dotenv').config(); // required for MongoDB connection string
const axios = require('axios');
const cache = require('./cache');
const pkg = require('../package.json');

axios.defaults.headers.common['User-Agent'] = `verificac19-sdk-node/${pkg.version}`;

const API_URL = 'https://get.dgc.gov.it/v1/dgc';

const setUp = async (crlManager) => {
  await cache.setUp(crlManager);
};

const checkCRL = async () => {
  const crlStatus = cache.getCRLStatus();
  try {
    const resp = await axios
      .get(`${API_URL}/drl/check?version=${crlStatus.version}`);
    if (resp.status === 200) {
      if (!crlStatus.completed && crlStatus.targetVersion !== resp.data.version) {
        await cache.cleanCRL();
        return await checkCRL();
      }
      if (resp.data.numDiAdd > 0 || resp.data.numDiDelete > 0) {
        return resp.data;
      }
    }
    return false;
  } catch {
    return false;
  }
};

const updateCRL = async () => {
  if (!cache.needCRLUpdate()) return;
  let resp;
  const checkData = await checkCRL();
  if (checkData) {
    const crlStatus = cache.getCRLStatus();
    do {
      try {
        resp = await axios
          .get(`${API_URL}/drl?chunk=${crlStatus.chunk + 1}&version=${crlStatus.version}`);
      } catch {
        break;
      }
      if (resp.status === 200) {
        // Check delta or full version
        if (resp.data.delta) {
          await cache.storeCRLRevokedUVCI(resp.data.delta.insertions, resp.data.delta.deletions);
        } else {
          await cache.storeCRLRevokedUVCI(resp.data.revokedUcvi);
        }
        crlStatus.chunk += 1;
        if (crlStatus.chunk < resp.data.lastChunk) { // Download in progress
          cache.storeCRLStatus(crlStatus.chunk, resp.data.lastChunk, crlStatus.version, checkData.version);
        } else { // Download completed
          cache.storeCRLStatus(0, 0, checkData.version, checkData.version);
          break;
        }
      } else {
        break;
      }
    // eslint-disable-next-line no-constant-condition
    } while (true);
  }
};

const updateRules = async () => {
  if (!cache.needRulesUpdate()) return false;
  const resp = await axios.get(`${API_URL}/settings`);
  const json = JSON.stringify(resp.data, null, 1);
  cache.storeRules(json);
  return resp.data;
};

const updateSignaturesList = async () => {
  if (!cache.needSignaturesListUpdate()) return false;
  const resp = await axios.get(
    `${API_URL}/signercertificate/status`,
  );
  const json = JSON.stringify(resp.data, null, 1);
  cache.storeSignaturesList(json);
  return resp.data;
};

const updateSignatures = async () => {
  if (!cache.needSignaturesUpdate()) return false;
  let header;
  let resp;
  const signatures = {};
  do {
    resp = await axios.get(
      `${API_URL}/signercertificate/update`,
      {
        headers: header,
      },
    );
    if (resp.status === 200) {
      header = { 'X-RESUME-TOKEN': resp.headers['x-resume-token'] };
      signatures[resp.headers['x-kid']] = `-----BEGIN CERTIFICATE-----${resp.data}-----END CERTIFICATE-----`;
    }
  } while (resp.status === 200);
  const json = JSON.stringify(signatures, null, 1);
  cache.storeSignatures(json);
  return signatures;
};

const tearDown = async () => {
  await cache.tearDown();
};

const updateAll = async (crlManager) => {
  await setUp(crlManager);
  await updateRules();
  await updateSignaturesList();
  await updateSignatures();
  await updateCRL();
  await tearDown();
};

const cleanCRL = async () => {
  await cache.cleanCRL();
};

module.exports = {
  updateSignatures,
  updateSignaturesList,
  updateRules,
  updateAll,
  updateCRL,
  setUp,
  tearDown,
  cleanCRL,
};
