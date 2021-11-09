const chai = require('chai');
const mockdate = require('mockdate');
const { Certificate, Validator } = require('../src');

chai.use(require('chai-as-promised'));
chai.use(require('chai-match'));

const verifyRulesFromImage = async (imagePath, expectedResult, expectedCode, expectedMessageReg = null) => {
  const dcc = await Certificate.fromImage(imagePath);
  const rulesReport = Validator.checkRules(dcc);
  chai.expect(rulesReport.result).to.be.equal(expectedResult);
  chai.expect(rulesReport.code).to.be.equal(expectedCode);
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
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_1.png', false,
      Validator.codes.NOT_VALID,
      '^Doses 1/2 - Vaccination is expired at .*$',
    );
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_2.png', false,
      Validator.codes.NOT_VALID,
      '^Doses 1/2 - Vaccination is expired at .*$',
    );
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_3.png', true,
      Validator.codes.VALID,
      '^Doses 2/2 - Vaccination is valid .*$',
    );
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_4.png', true,
      Validator.codes.VALID,
      '^Doses 2/2 - Vaccination is valid .*$',
    );
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_5.png', true,
      Validator.codes.VALID,
      '^Doses 1/1 - Vaccination is valid .*$',
    );
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_6.png', false,
      Validator.codes.NOT_VALID,
      '^Recovery statement is expired at .*$',
    );
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_7.png', false,
      Validator.codes.NOT_VALID,
      '^Test Result is expired at .*$',
    );
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_8.png', false,
      Validator.codes.NOT_VALID,
      '^Test Result is expired at .*$',
    );
  });

  it('makes rules verification on special cases', async () => {
    // Valid test results
    mockdate.set('2021-05-22T12:34:56.000Z');
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_7.png', true,
      Validator.codes.VALID,
      '^Test Result is valid .*$',
    );
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_8.png', true,
      Validator.codes.VALID,
      '^Test Result is valid .*$',
    );
    // Doses 1/2 valid only in Italy
    mockdate.set('2021-06-24T00:00:00.000Z');
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_1.png', true,
      Validator.codes.PARTIALLY_VALID,
      '^Doses 1/2 - Vaccination is valid .*$',
    );
    // Test result not valid yet
    mockdate.set('2021-04-22T12:34:56.000Z');
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_7.png', false,
      Validator.codes.NOT_VALID_YET,
      '^Test Result is not valid yet, starts at .*$',
    );
    // Doses 1/2 not valid yet
    mockdate.set('2021-05-24T00:00:00.000Z');
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_1.png', false,
      Validator.codes.NOT_VALID_YET,
      '^Doses 1/2 - Vaccination is not valid yet, .*$',
    );
    // Doses 2/2 not valid yet
    mockdate.set('2021-05-18T00:00:00.000Z');
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_3.png', false,
      Validator.codes.NOT_VALID_YET,
      '^Doses 2/2 - Vaccination is not valid yet, .*$',
    );
    // Doses 2/2 expired
    mockdate.set('2022-06-17T00:00:00.000Z');
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_4.png', false,
      Validator.codes.NOT_VALID,
      '^Doses 2/2 - Vaccination is expired at .*$',
    );
    // Recovery statement is valid
    mockdate.set('2021-10-20T00:00:00.000Z');
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_6.png', true,
      Validator.codes.VALID,
      '^Recovery statement is valid .*$',
    );
    // Recovery statement is not valid yet
    mockdate.set('2021-04-22T12:34:56.000Z');
    await verifyRulesFromImage(
      './test/data/eu_test_certificates/SK_6.png', false,
      Validator.codes.NOT_VALID_YET,
      '^Recovery statement is not valid yet, starts at .*$',
    );
    mockdate.reset();
  });
});
