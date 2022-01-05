const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const mockdate = require('mockdate');
const mongoose = require('mongoose');

const { CertificateVerificationError } = require('../src/errors');

const { Service, Certificate, Validator } = require('../src');

const MOCK_REQUESTS_PATH = path.join('test', 'data', 'responses');
const API_BASE_URL = 'https://get.dgc.gov.it/v1/dgc';

chai.use(chaiAsPromised);

let dbModel; let
  dBConnection;

const prepareDB = async () => {
  dBConnection = await mongoose.createConnection(
    process.env.VC19_MONGODB_URL || 'mongodb://root:example@localhost:27017/VC19?authSource=admin',
  );
  dbModel = dBConnection.model('UVCI', new mongoose.Schema({
    _id: String,
  }));
};

const mockSettingsRequests = () => {
  const settings = JSON.parse(fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'settings.json')));
  nock(API_BASE_URL)
    .get('/settings')
    .reply(200, settings);
  const xkids = JSON.parse(fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'DSC-validation.json'))).map((el) => el.kid);
  nock(API_BASE_URL)
    .get('/signercertificate/status')
    .reply(200, xkids);

  const signatures = JSON.parse(fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'DSC-validation.json'))).map((el) => el.raw_data);
  nock(API_BASE_URL)
    .get('/signercertificate/update')
    .reply(200, signatures[0], { 'X-RESUME-TOKEN': '1', 'X-KID': xkids[0] });

  for (let i = 1; i < signatures.length; i += 1) {
    nock(API_BASE_URL, {
      reqheaders: {
        'X-RESUME-TOKEN': i,
      },
    })
      .get('/signercertificate/update')
      .reply(200, signatures[i], { 'X-RESUME-TOKEN': `${i + 1}`, 'X-KID': xkids[i] });
  }

  nock(API_BASE_URL, {
    reqheaders: {
      'X-RESUME-TOKEN': signatures.length,
    },
  })
    .get('/signercertificate/update')
    .reply(203, {});
};

const mockCRLRequests = () => {
  // Mock CRL check
  for (let i = 0; i < 3; i += 1) {
    nock(API_BASE_URL)
      .get(`/drl/check?version=${i}`)
      .reply(200, JSON.parse(
        fs.readFileSync(path.join(MOCK_REQUESTS_PATH, `CRL-check-v${i + 1}.json`)),
      ));
  }
  nock(API_BASE_URL)
    .get('/drl/check?version=2')
    .reply(400, {});

  // Mock CRL download
  nock(API_BASE_URL)
    .get('/drl?chunk=1&version=0')
    .reply(200, JSON.parse(
      fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v1-c1.json')),
    ));
  nock(API_BASE_URL)
    .get('/drl?chunk=2&version=0')
    .reply(200, JSON.parse(
      fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v1-c2.json')),
    ));
  nock(API_BASE_URL)
    .get('/drl?chunk=1&version=1')
    .reply(200, JSON.parse(
      fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v2-c1.json')),
    ));
  nock(API_BASE_URL)
    .get('/drl?chunk=1&version=2')
    .reply(200, JSON.parse(
      fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v3-c1.json')),
    ));
};

const mockRequests = () => {
  mockSettingsRequests();
  mockCRLRequests();
};

describe('Testing Service', () => {
  afterEach(async () => {
    if (dBConnection) {
      await dBConnection.close();
    }
  });
  it('checks caching individually', async () => {
    mockRequests();
    // Validation without files throws CertificateVerificationError
    const dccPath = path.join('test', 'data', 'eu_test_certificates', 'SK_3.png');
    const dcc = await Certificate.fromImage(dccPath);
    await chai.expect(Validator.checkRules(dcc)).to.be.rejectedWith(CertificateVerificationError);
    // Update cache
    let result;
    result = await Service.updateRules();
    chai.expect(result).not.to.be.equal(false);
    result = await Service.updateSignaturesList();
    chai.expect(result).not.to.be.equal(false);
    result = await Service.updateSignatures();
    chai.expect(result).not.to.be.equal(false);
    result = await Service.updateRules();
    chai.expect(result).to.be.equal(false);
    result = await Service.updateSignaturesList();
    chai.expect(result).to.be.equal(false);
    result = await Service.updateSignatures();
    chai.expect(result).to.be.equal(false);

    // You can update cache after 24 hours
    mockRequests();
    mockdate.set(new Date(Date.now() + 24 * 60 * 60 * 1000));
    result = await Service.updateRules();
    chai.expect(result).not.to.be.equal(false);
    result = await Service.updateSignaturesList();
    chai.expect(result).not.to.be.equal(false);
    result = await Service.updateSignatures();
    chai.expect(result).not.to.be.equal(false);
    mockdate.reset();
    nock.cleanAll();
  });
  it('checks caching all', async () => {
    mockRequests();
    await Service.updateAll();
    nock.cleanAll();
  });
  it('checks clean CRL working', async () => {
    mockRequests();
    await prepareDB();
    await Service.cleanCRL();
    // Check 0 elements
    chai.expect(await dbModel.count()).to.be.equal(0);
    mockRequests();
    await Service.updateAll();
    // Check 9 elements
    chai.expect(await dbModel.count()).to.be.equal(9);
    mockdate.set(new Date(Date.now() + 24 * 60 * 60 * 1000));
    mockRequests();
    await Service.updateAll();
    // Check 12 elements
    chai.expect(await dbModel.count()).to.be.equal(12);
    mockdate.reset();
    mockdate.set(new Date(Date.now() + 24 * 60 * 60 * 1000));
    mockRequests();
    await Service.updateAll();
    // Check 11 elements
    chai.expect(await dbModel.count()).to.be.equal(11);
    mockdate.reset();
    nock.cleanAll();
  });
  it('checks CRL download restore', async () => {
    mockSettingsRequests();
    await prepareDB();
    await Service.cleanCRL();
    const dccPath = path.join('test', 'data', 'eu_test_certificates', 'SK_3.png');
    const dcc = await Certificate.fromImage(dccPath);

    nock(API_BASE_URL)
      .get('/drl/check?version=0')
      .reply(200, JSON.parse(
        fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-check-v1.json')),
      ));
    nock(API_BASE_URL)
      .get('/drl?chunk=1&version=0')
      .reply(200, JSON.parse(
        fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v1-c1.json')),
      ));
    nock(API_BASE_URL)
      .get('/drl?chunk=2&version=0')
      .reply(400, {});
    await Service.updateAll();
    // Check 5 elements
    chai.expect(await dbModel.count()).to.be.equal(5);
    nock.cleanAll();
    mockSettingsRequests();
    // Check cache not ready
    await chai.expect(Validator.checkRules(dcc)).to.be.rejectedWith(CertificateVerificationError);
    nock(API_BASE_URL)
      .get('/drl/check?version=0')
      .times(2) // Check CRL 2 times
      .reply(200, JSON.parse(
        fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-check-v2.json')),
      ));
    nock(API_BASE_URL)
      .get('/drl?chunk=1&version=0')
      .reply(200, JSON.parse(
        fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v1-c1.json')),
      ));
    nock(API_BASE_URL)
      .get('/drl?chunk=2&version=0')
      .reply(200, JSON.parse(
        fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v1-c2.json')),
      ));
    await Service.updateAll();
    // Check 9 elements
    chai.expect(await dbModel.count()).to.be.equal(9);
    // Check cache is ready
    await Validator.checkRules(dcc);
    nock.cleanAll();
  });
  it('checks CRL works with a blacklisted certificate', async () => {
    mockRequests();
    await prepareDB();
    await Service.updateAll();
    // Prepare blacklisted certificate
    const dccPath = path.join('test', 'data', 'eu_test_certificates', 'SK_3.png');
    const dcc = await Certificate.fromImage(dccPath);
    chai.expect((await Validator.checkRules(dcc)).result).to.be.equal(true);
    // Check that certificate is not valid anymore after CRL update
    await Service.updateAll();
    const newRevokedUVCI = dcc.vaccinations
      .map(
        (vaccination) => (crypto.createHash('sha256').update(vaccination.certificateIdentifier).digest('base64')),
      );
    dbModel.insertMany(
      [...new Set(newRevokedUVCI)].map((uvci) => ({ _id: uvci })),
    );
    chai.expect((await Validator.checkRules(dcc)).result).to.be.equal(false);
    await Service.cleanCRL();
    nock.cleanAll();
  });
  it('checks Service auto connection', async () => {
    await Service.setUp();
    await Service.setUp();
    await Service.tearDown();
    await Service.cleanCRL();
  });
});
