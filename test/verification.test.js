const path = require('path');
const chai = require('chai');
const mockdate = require('mockdate');
const { Certificate, Validator } = require('../src');

chai.use(require('chai-as-promised'));
chai.use(require('chai-match'));

const verifyRulesFromCertificate = (dcc, expectedResult, expectedCode, expectedMessageReg = null, mode = Validator.mode.NORMAL_DGP) => {
  const rulesReport = Validator.checkRules(dcc, mode);
  chai.expect(rulesReport.result).to.be.equal(expectedResult);
  chai.expect(rulesReport.code).to.be.equal(expectedCode);
  if (expectedMessageReg) {
    chai.expect(rulesReport.message).to.match(new RegExp(expectedMessageReg));
  }
};

const verifyRulesFromImage = async (imagePath, expectedResult, expectedCode, expectedMessageReg = null, mode = Validator.mode.NORMAL_DGP) => {
  const dcc = await Certificate.fromImage(imagePath);
  return verifyRulesFromCertificate(dcc, expectedResult, expectedCode, expectedMessageReg, mode);
};

const verifyRulesAndSignature = async (imagePath, expectedRules, expectedSignature, mode = Validator.mode.NORMAL_DGP) => {
  const dcc = await Certificate.fromImage(imagePath);
  const areRulesOk = Validator.checkRules(dcc, mode).result;
  chai.expect(areRulesOk).to.be.equal(expectedRules);
  const isSignatureVerified = await Validator.checkSignature(dcc);
  chai.expect(isSignatureVerified).to.be.equal(expectedSignature);
  return areRulesOk && isSignatureVerified;
};

const verifyRulesAndSignatureWithVerify = async (imagePath, expectedRules, expectedSignature, mode = Validator.mode.NORMAL_DGP) => {
  const dcc = await Certificate.fromImage(imagePath);
  const certificateResult = await Validator.validate(dcc, mode);
  chai.expect(certificateResult.result).to.be.equal(expectedRules && expectedSignature);
  return certificateResult.result;
};

describe('Testing integration between Certificate and Validator', () => {
  it('makes rules verification with individual methods', async () => {
    await verifyRulesAndSignature(path.join('test', 'data', 'shit.png'), false, true);
    await verifyRulesAndSignature(path.join('test', 'data', '2.png'), false, false);
    await verifyRulesAndSignature(path.join('test', 'data', 'example_qr_vaccine_recovery.png'), true, false);
    await verifyRulesAndSignature(path.join('test', 'data', 'mouse.jpeg'), false, true);
    await verifyRulesAndSignature(path.join('test', 'data', 'signed_cert.png'), false, false);
    await verifyRulesAndSignature(path.join('test', 'data', 'uk_qr_vaccine_dose1.png'), false, false);
  });

  it('makes rules verification with verify', async () => {
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'shit.png'), false, true);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', '2.png'), false, false);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'example_qr_vaccine_recovery.png'), false, false);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'mouse.jpeg'), false, true);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'signed_cert.png'), false, false);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'uk_qr_vaccine_dose1.png'), false, false);
  });

  it('makes rules verification on SK testing certificates', async () => {
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_1.png'), false,
      Validator.codes.NOT_VALID,
      '^Doses 1/2 - Vaccination is expired at .*$',
    );
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_2.png'), false,
      Validator.codes.NOT_VALID,
      '^Doses 1/2 - Vaccination is expired at .*$',
    );
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'), true,
      Validator.codes.VALID,
      '^Doses 2/2 - Vaccination is valid .*$',
    );
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_4.png'), true,
      Validator.codes.VALID,
      '^Doses 2/2 - Vaccination is valid .*$',
    );
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_5.png'), true,
      Validator.codes.VALID,
      '^Doses 1/1 - Vaccination is valid .*$',
    );
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_6.png'), false,
      Validator.codes.NOT_VALID,
      '^Recovery statement is expired .*$',
    );
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_7.png'), false,
      Validator.codes.NOT_VALID,
      '^Test Result is expired at .*$',
    );
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_8.png'), false,
      Validator.codes.NOT_VALID,
      '^Test Result is expired at .*$',
    );
  });

  it('makes rules verification on special cases', async () => {
    // Valid test results
    mockdate.set('2021-05-22T12:34:56.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_7.png'), true,
      Validator.codes.VALID,
      '^Test Result is valid .*$',
    );
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_8.png'), true,
      Validator.codes.VALID,
      '^Test Result is valid .*$',
    );
    // Verify with Super Green Pass
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_8.png'), false,
      Validator.codes.NOT_VALID,
      '^Not valid. Super DGP required.$',
      Validator.mode.SUPER_DGP,
    );
    // Doses 1/2 valid only in Italy
    mockdate.set('2021-06-24T00:00:00.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_1.png'), true,
      Validator.codes.PARTIALLY_VALID,
      '^Doses 1/2 - Vaccination is valid .*$',
    );
    // Test result not valid yet
    mockdate.set('2021-04-22T12:34:56.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_7.png'), false,
      Validator.codes.NOT_VALID_YET,
      '^Test Result is not valid yet, starts at .*$',
    );
    // Doses 1/2 not valid yet
    mockdate.set('2021-05-24T00:00:00.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_1.png'), false,
      Validator.codes.NOT_VALID_YET,
      '^Doses 1/2 - Vaccination is not valid yet, .*$',
    );
    // Doses 2/2 not valid yet
    mockdate.set('2021-05-18T00:00:00.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'), false,
      Validator.codes.NOT_VALID_YET,
      '^Doses 2/2 - Vaccination is not valid yet, .*$',
    );
    // Doses 2/2 expired
    mockdate.set('2022-06-17T00:00:00.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_4.png'), false,
      Validator.codes.NOT_VALID,
      '^Doses 2/2 - Vaccination is expired at .*$',
    );
    // Recovery statement is valid
    mockdate.set('2021-10-20T00:00:00.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_6.png'), true,
      Validator.codes.VALID,
      '^Recovery statement is valid .*$',
    );
    // Recovery statement is not valid yet
    mockdate.set('2021-04-22T12:34:56.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_6.png'), false,
      Validator.codes.NOT_VALID_YET,
      '^Recovery statement is not valid yet, starts at .*$',
    );
    // Recovery statement is not valid
    mockdate.set('2022-04-22T12:34:56.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_6.png'), false,
      Validator.codes.NOT_VALID,
      '^Recovery statement is expired at .*$',
    );
    // Not valid greenpass without recovery
    const dccWithoutRecovery = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_6.png'),
    );
    dccWithoutRecovery.recoveryStatements = [];
    verifyRulesFromCertificate(
      dccWithoutRecovery, false, Validator.codes.NOT_EU_DCC,
    );
    // Not valid greenpass without tests
    const dccWithoutTests = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_7.png'),
    );
    dccWithoutTests.tests = [];
    verifyRulesFromCertificate(
      dccWithoutTests, false, Validator.codes.NOT_EU_DCC,
    );
    // Not valid greenpass without vaccinations
    const dccWithoutVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccWithoutVaccinations.vaccinations = [];
    verifyRulesFromCertificate(
      dccWithoutVaccinations, false, Validator.codes.NOT_EU_DCC,
    );
    // Negative vaccination
    const dccWithNegativeVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccWithNegativeVaccinations.vaccinations[1].doseNumber = -1;
    verifyRulesFromCertificate(
      dccWithNegativeVaccinations, false, Validator.codes.NOT_VALID,
    );
    // Malformed vaccination
    const dccWithMalformedVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccWithMalformedVaccinations.vaccinations[1].doseNumber = 'a';
    verifyRulesFromCertificate(
      dccWithMalformedVaccinations, false, Validator.codes.NOT_VALID,
    );
    mockdate.reset();
    // SM vaccination (Sputnik-V)
    const dccSMSputnikVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SM_1.png'),
    );
    verifyRulesFromCertificate(
      dccSMSputnikVaccinations, true, Validator.codes.VALID,
    );
    // Other countries vaccination with Sputnik-V
    const dccITSputnikVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SM_1.png'),
    );
    dccITSputnikVaccinations.vaccinations[0].countryOfVaccination = 'IT';
    verifyRulesFromCertificate(
      dccITSputnikVaccinations, false, Validator.codes.NOT_VALID,
    );
  });
});
