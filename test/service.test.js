const fs = require('fs');
const path = require('path');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const mockdate = require('mockdate');

process.env.VC19_CACHE_FOLDER = './test/data/tempcache';
const { Service } = require('../src');

chai.use(chaiAsPromised);

const mockRequests = () => {
  nock('https://get.dgc.gov.it/v1/dgc')
    .get('/settings')
    .replyWithFile(200, path.join('test', 'mock', 'settings.json'), {
      'Content-Type': 'application/json',
    });
  const xkids = JSON.parse(fs.readFileSync(path.join('test', 'data', 'DSC-validation.json'))).map((el) => el.kid);
  nock('https://get.dgc.gov.it/v1/dgc')
    .get('/signercertificate/status')
    .reply(200, xkids);

  const signatures = JSON.parse(fs.readFileSync(path.join('test', 'data', 'DSC-validation.json'))).map((el) => el.raw_data);
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
  });
});
