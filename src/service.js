// Update procedures
const axios = require('axios');
const cache = require('./cache');

const API_URL = 'https://get.dgc.gov.it/v1/dgc';

cache.setUp();

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

const updateAll = async () => {
  await updateRules();
  await updateSignaturesList();
  await updateSignatures();
};

module.exports = {
  updateSignatures, updateSignaturesList, updateRules, updateAll,
};
