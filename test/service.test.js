const fs = require('fs');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');

process.env.VC19_CACHE_FOLDER = './test/data/tempcache';
const { Service } = require('../src');

chai.use(chaiAsPromised);

const mockRequests = () => {
  nock('https://get.dgc.gov.it/v1/dgc')
    .get('/settings')
    .replyWithFile(200, './test/mock/settings.json', {
      'Content-Type': 'application/json',
    });
  const xkids = JSON.parse(fs.readFileSync('./test/data/DSC-validation.json')).map((el) => el.kid);
  nock('https://get.dgc.gov.it/v1/dgc')
    .get('/signercertificate/status')
    .reply(200, xkids);

  const signatures = JSON.parse(fs.readFileSync('./test/data/DSC-validation.json')).map((el) => el.raw_data);
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
    await Service.updateRules();
    await Service.updateSignaturesList();
    await Service.updateSignatures();
  });
  it('checks caching all', async () => {
    mockRequests();
    await Service.updateAll();
  });
});
