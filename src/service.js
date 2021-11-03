// Update procedures
const fs = require('fs');
const axios = require('axios');
const { CACHE_FOLDER } = require('./consts');

const API_URL = 'https://get.dgc.gov.it/v1/dgc';

fs.promises.mkdir(CACHE_FOLDER, { recursive: true });

async function updateRules() {
  const resp = await axios.get(`${API_URL}/settings`);
  const json = JSON.stringify(resp.data, null, 1);
  fs.writeFileSync(`${CACHE_FOLDER}/rules.json`, json);
  return resp.data;
}

async function updateSignaturesList() {
  const resp = await axios.get(
    `${API_URL}/signercertificate/status`,
  );
  const json = JSON.stringify(resp.data, null, 1);
  fs.writeFileSync(`${CACHE_FOLDER}/signatureslist.json`, json);
  return resp.data;
}

async function updateSignatures() {
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
      signatures[resp.headers['x-kid']] = resp.data;
    }
  } while (resp.status === 200);

  const json = JSON.stringify(signatures, null, 1);
  fs.writeFile(`${CACHE_FOLDER}/signatures.json`, json);
  return signatures;
}

module.exports = { updateSignatures, updateSignaturesList, updateRules };
