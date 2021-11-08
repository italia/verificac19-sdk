const chai = require('chai');
const { Certificate, Validator } = require('../src');

chai.use(require('chai-as-promised'));
chai.use(require('chai-match'));

const verifyRules = async (imagePath, expectedResult, expectedMessageReg = null) => {
  const dcc = await Certificate.fromImage(imagePath);
  const rulesReport = Validator.checkRules(dcc);
  chai.expect(rulesReport.result).to.be.equal(expectedResult);
  if (expectedMessageReg) {
    chai.expect(rulesReport.message).to.match(new RegExp(expectedMessageReg));
  }
};

const verifyRulesAndSignature = async (imagePath, expectedRules, expectedSignature) => {
  const dcc = await Certificate.fromImage(imagePath);
  const areRulesOk = Validator.checkRules(dcc).result;
  chai.expect(areRulesOk).to.be.equal(expectedRules);
  const isSignatureVerified = await Validator.checkSignature(dcc);
  chai.expect(isSignatureVerified).to.be.equal(expectedSignature);
  return areRulesOk && isSignatureVerified;
};

describe('Testing integration between Certificate and Validator', () => {
  it('makes rules verification', async () => {
    await verifyRulesAndSignature('./test/data/shit.png', false, true);
    await verifyRulesAndSignature('./test/data/2.png', false, false);
    await verifyRulesAndSignature('./test/data/example_qr_vaccine_recovery.png', false, false);
    await verifyRulesAndSignature('./test/data/mouse.jpeg', false, true);
    await verifyRulesAndSignature('./test/data/signed_cert.png', false, false);
    await verifyRulesAndSignature('./test/data/uk_qr_vaccine_dose1.png', false, false);
  });

  it('makes rules verification on SK testing certificates', async () => {
    await verifyRules(
      './test/data/eu_test_certificates/SK_1.png', false,
      '^Doses 1/2 - Vaccination is expired at .*$',
    );
    await verifyRules(
      './test/data/eu_test_certificates/SK_2.png', false,
      '^Doses 1/2 - Vaccination is expired at .*$',
    );
    await verifyRules(
      './test/data/eu_test_certificates/SK_3.png', true,
      '^Doses 2/2 - Vaccination is valid .*$',
    );
    await verifyRules(
      './test/data/eu_test_certificates/SK_4.png', true,
      '^Doses 2/2 - Vaccination is valid .*$',
    );
    await verifyRules(
      './test/data/eu_test_certificates/SK_5.png', true,
      '^Doses 1/1 - Vaccination is valid .*$',
    );
    await verifyRules(
      './test/data/eu_test_certificates/SK_6.png', false,
      '^Recovery statement is expired at .*$',
    );
    await verifyRules(
      './test/data/eu_test_certificates/SK_7.png', false,
      '^Test Result is expired at .*$',
    );
    await verifyRules(
      './test/data/eu_test_certificates/SK_8.png', false,
      '^Test Result is expired at .*$',
    );
  });
});
