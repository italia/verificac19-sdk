const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Certificate, Validator } = require('../src');

chai.use(chaiAsPromised);

const verifyRulesAndSignature = async (imagePath, expectedRules, expectedSignature) => {
  try {
    const dcc = await Certificate.fromImage(imagePath);
    const areRuleOk = Validator.checkRules(dcc).result;
    chai.expect(areRuleOk).to.be.equal(expectedRules);
    const isSignatureVerified = await Validator.checkSignature(dcc);
    chai.expect(isSignatureVerified).to.be.equal(expectedSignature);
    return areRuleOk && isSignatureVerified;
  } catch (error) {
    return false;
  }
};

describe('Testing integration between Certificate and Validator', () => {
  it('rules verification', async () => {
    await verifyRulesAndSignature('./test/data/shit.png', false, true);
    await verifyRulesAndSignature('./test/data/2.png', false, false);
    await verifyRulesAndSignature('./test/data/example_qr_vaccine_recovery.png', false, false);
    await verifyRulesAndSignature('./test/data/invalid.png', true, true);
    await verifyRulesAndSignature('./test/data/mouse.jpeg', false, true);
    await verifyRulesAndSignature('./test/data/not_valid_certificate.png', false, false);
    await verifyRulesAndSignature('./test/data/signed_cert.png', false, false);
    await verifyRulesAndSignature('./test/data/uk_qr_vaccine_dose1.png', false, false);
  });
});
