const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const {
  Certificate, Service, Validator, FileCache,
} = require('../src');

chai.use(chaiAsPromised);

describe('Testing Validator with File Cache', () => {
  beforeEach(async () => {
    await Service.setUp(null, new FileCache());
    chai.expect(Service.getCurrentCacheManager().identifier).to.be.equal('filecache');
    Service.getCurrentCacheManager().isReady = async () => true;
  });
  afterEach(async () => {
    await Service.tearDown();
  });
  it('checks rules verification', async () => {
    const dcc = await Certificate.fromImage(path.join('test', 'data', 'shit.png'));
    const rls = await Validator.checkRules(dcc);
    chai.expect(rls.result).to.be.equal(false);
  });

  it('checks signature verification false', async () => {
    const dcc = await Certificate.fromImage(path.join('test', 'data', '2.png'));
    const isSignatureVerified = await Validator.checkSignature(dcc);
    chai.expect(isSignatureVerified).to.be.equal(false);
  });

  it('checks signature verification true', async () => {
    const dcc = await Certificate.fromImage(path.join('test', 'data', 'shit.png'));
    const isSignatureVerified = await Validator.checkSignature(dcc);
    chai.expect(isSignatureVerified).to.be.equal(true);
  });
});

describe('Testing Validator with Mongo Cache', () => {
  beforeEach(async () => {
    await Service.setUp();
    chai.expect(Service.getCurrentCacheManager().identifier).to.be.equal('mongocache');
    Service.getCurrentCacheManager().isReady = async () => true;
  });
  afterEach(async () => {
    await Service.tearDown();
  });
  it('checks rules verification', async () => {
    const dcc = await Certificate.fromImage(path.join('test', 'data', 'shit.png'));
    const rls = await Validator.checkRules(dcc);
    chai.expect(rls.result).to.be.equal(false);
  });

  it('checks signature verification false', async () => {
    const dcc = await Certificate.fromImage(path.join('test', 'data', '2.png'));
    const isSignatureVerified = await Validator.checkSignature(dcc);
    chai.expect(isSignatureVerified).to.be.equal(false);
  });

  it('checks signature verification true', async () => {
    const dcc = await Certificate.fromImage(path.join('test', 'data', 'shit.png'));
    const isSignatureVerified = await Validator.checkSignature(dcc);
    chai.expect(isSignatureVerified).to.be.equal(true);
  });
});
