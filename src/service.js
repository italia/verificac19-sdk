// Update procedures
const axios = require('axios');
const cache = require('./cache');

const API_URL = 'https://get.dgc.gov.it/v1/dgc';

const setUp = async () => {
  await cache.setUp();
};

const checkCRL = async () => {
  const crlStatus = cache.getCRLStatus();
  try {
    const resp = await axios
      .get(`https://testaka4.sogei.it/v1/dgc/drl/check?version=${crlStatus.version}`);
    return resp.status === 200;
  } catch {
    return false;
  }
};

const updateCRL = async () => {
  let resp;
  while (await checkCRL()) {
    const crlStatus = cache.getCRLStatus();
    do {
      try {
        resp = await axios
          .get(`https://testaka4.sogei.it/v1/dgc/drl?chunk=${crlStatus.chunk}&version=${crlStatus.version}`);
        await cache.storeCRLRevokedUCVI(resp.data.revokedUcvi);
        crlStatus.chunk += 1;
        cache.storeCRLStatus(crlStatus.chunk, crlStatus.version);
      } catch {
        break;
      }
    } while (resp.status === 200 && crlStatus.chunk > resp.data.chunk);
    cache.storeCRLStatus(1, crlStatus.version + 1);
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

const updateAll = async () => {
  await setUp();
  await updateRules();
  await updateSignaturesList();
  await updateSignatures();
  await tearDown();
};

module.exports = {
  updateSignatures, updateSignaturesList, updateRules, updateAll, updateCRL, checkCRL, setUp, tearDown,
};
