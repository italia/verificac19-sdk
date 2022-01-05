const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { Certificate, Validator } = require('../src');
const cache = require('../src/cache');

const oldIsReady = cache.isReady;
chai.use(chaiAsPromised);

describe('Testing Validator', () => {
  beforeEach(() => {
    cache.isReady = () => true;
  });
  afterEach(() => {
    cache.isReady = oldIsReady;
  });
  it('checks rules verification', async () => {
    const dcc = await Certificate.fromImage(path.join('test', 'data', 'shit.png'));
    chai.expect((await Validator.checkRules(dcc)).result).to.be.equal(false);
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
