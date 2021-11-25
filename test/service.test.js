const fs = require('fs');
const path = require('path');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const mockdate = require('mockdate');

process.env.VC19_CACHE_FOLDER = path.join('test', 'data', 'tempcache');
const MOCK_REQUESTS_PATH = path.join('test', 'data', 'responses');
const { Service } = require('../src');

chai.use(chaiAsPromised);

const mockRequests = () => {
  nock('https://get.dgc.gov.it/v1/dgc')
    .get('/settings')
    .replyWithFile(200, path.join('test', 'mock', 'settings.json'), {
      'Content-Type': 'application/json',
    });
  const xkids = JSON.parse(fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'DSC-validation.json'))).map((el) => el.kid);
  nock('https://get.dgc.gov.it/v1/dgc')
    .get('/signercertificate/status')
    .reply(200, xkids);

  const signatures = JSON.parse(fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'DSC-validation.json'))).map((el) => el.raw_data);
  nock('https://get.dgc.gov.it/v1/dgc')
    .get('/signercertificate/update')
    .reply(200, signatures[0], { 'X-RESUME-TOKEN': '1', 'X-KID': xkids[0] });

  for (let i = 1; i < signatures.length; i += 1) {
    nock('https://get.dgc.gov.it/v1/dgc', {
      reqheaders: {
        'X-RESUME-TOKEN': i,
      },
    })
      .get('/signercertificate/update')
      .reply(200, signatures[i], { 'X-RESUME-TOKEN': `${i + 1}`, 'X-KID': xkids[i] });
  }

  nock('https://get.dgc.gov.it/v1/dgc', {
    reqheaders: {
      'X-RESUME-TOKEN': signatures.length,
    },
  })
    .get('/signercertificate/update')
    .reply(203, {});

  // Mock CRL check
  for (let i = 0; i < 2; i += 1) {
    nock('https://testaka4.sogei.it/v1/dgc')
      .get(`/drl/check?version=${i}`)
      .reply(200, JSON.parse(
        fs.readFileSync(path.join(MOCK_REQUESTS_PATH, `CRL-check-v${i + 1}.json`)),
      ));
  }
  nock('https://testaka4.sogei.it/v1/dgc')
    .get('/drl/check?version=2')
    .reply(400, {});

  // Mock CRL download
  nock('https://testaka4.sogei.it/v1/dgc')
    .get('/drl?chunk=1&version=0')
    .reply(200, JSON.parse(
      fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v1-c1.json')),
    ));
  nock('https://testaka4.sogei.it/v1/dgc')
    .get('/drl?chunk=2&version=0')
    .reply(200, JSON.parse(
      fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v1-c2.json')),
    ));
  nock('https://testaka4.sogei.it/v1/dgc')
    .get('/drl?chunk=1&version=1')
    .reply(200, JSON.parse(
      fs.readFileSync(path.join(MOCK_REQUESTS_PATH, 'CRL-v2-c1.json')),
    ));
};

describe('Testing Service', () => {
  it('checks caching individually', async () => {
    mockRequests();
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
  });
  it('checks caching all', async () => {
    mockRequests();
    await Service.updateAll();
    await Service.cleanCRL();
    await Service.updateAll();
  });
});
