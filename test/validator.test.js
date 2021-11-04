const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Certificate, Validator } = require('../src');

chai.use(chaiAsPromised);

describe('Testing Validator', () => {
  it('rules verification', async () => {
    const dcc = await Certificate.fromImage('./test/data/shit.png');
    chai.expect(Validator.checkRules(dcc).result).to.be.equal(false);
  });

  it('signature verification false', async () => {
    const dcc = await Certificate.fromImage('./test/data/2.png');
    const isSignatureVerified = await Validator.checkSignature(dcc);
    chai.expect(isSignatureVerified).to.be.equal(false);
  });

  it('signature verification true', async () => {
    const dcc = await Certificate.fromImage('./test/data/shit.png');
    const isSignatureVerified = await Validator.checkSignature(dcc);
    chai.expect(isSignatureVerified).to.be.equal(true);
  });
});
