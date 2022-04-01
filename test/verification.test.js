const path = require('path');
const chai = require('chai');
const rewire = require('rewire');
const mockdate = require('mockdate');
const { Certificate, Validator } = require('../src');

const dccToModel = rewire('../src/certificate.js').__get__('dccToModel');
const cache = require('../src/cache');

const oldIsReady = cache.isReady;
chai.use(require('chai-as-promised'));
chai.use(require('chai-match'));

const verifyRulesFromCertificate = async (dcc, expectedResult, expectedCode, expectedMessageReg = null, mode = Validator.mode.NORMAL_DGP) => {
  const rulesReport = await Validator.checkRules(dcc, mode);
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
  const areRulesOk = (await Validator.checkRules(dcc, mode)).result;
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
  beforeEach(() => {
    cache.isReady = () => true;
  });
  afterEach(() => {
    cache.isReady = oldIsReady;
  });
  it('makes rules verification with individual methods', async () => {
    mockdate.set('2021-09-24T00:00:00.000Z');
    await verifyRulesAndSignature(path.join('test', 'data', 'shit.png'), false, true);
    await verifyRulesAndSignature(path.join('test', 'data', '2.png'), false, false);
    await verifyRulesAndSignature(path.join('test', 'data', 'example_qr_vaccine_recovery.png'), true, false);
    await verifyRulesAndSignature(path.join('test', 'data', 'mouse.jpeg'), false, true);
    await verifyRulesAndSignature(path.join('test', 'data', 'signed_cert.png'), false, false);
    await verifyRulesAndSignature(path.join('test', 'data', 'uk_qr_vaccine_dose1.png'), false, false);
    mockdate.reset();
  });

  it('makes rules verification with verify', async () => {
    mockdate.set('2021-09-24T00:00:00.000Z');
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'shit.png'), false, true);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', '2.png'), false, false);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'example_qr_vaccine_recovery.png'), false, false);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'mouse.jpeg'), false, true);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'signed_cert.png'), false, false);
    await verifyRulesAndSignatureWithVerify(path.join('test', 'data', 'uk_qr_vaccine_dose1.png'), false, false);
    mockdate.reset();
  });

  it('makes rules verification on SK testing certificates', async () => {
    mockdate.set('2021-07-24T00:00:00.000Z');
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
    mockdate.reset();
    mockdate.set('2021-11-24T00:00:00.000Z');
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
    mockdate.reset();
  });

  it('makes rules verification on booster cases and recovery bis', async () => {
    // Vaccine not completed not valid in booster mode
    mockdate.set('2021-06-24T00:00:00.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_1.png'), false,
      Validator.codes.NOT_VALID,
      '^Required complete vaccination$',
      Validator.mode.BOOSTER_DGP,
    );
    mockdate.reset();
    // Vaccine completed not valid in booster mode (test needed)
    mockdate.set('2021-06-24T00:00:00.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'), false,
      Validator.codes.TEST_NEEDED,
      '^Test needed$',
      Validator.mode.BOOSTER_DGP,
    );
    mockdate.reset();
    // Test not valid in booster mode
    mockdate.set('2021-05-22T12:34:56.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_7.png'), false,
      Validator.codes.NOT_VALID,
      '^Not valid. Super DGP or Booster required.$',
      Validator.mode.BOOSTER_DGP,
    );
    mockdate.reset();
    // Recovery statement not valid in booster mode (test needed)
    mockdate.set('2021-10-20T00:00:00.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_6.png'), false,
      Validator.codes.TEST_NEEDED,
      '^Test needed$',
      Validator.mode.BOOSTER_DGP,
    );
    mockdate.reset();
    // Recovery statement is valid
    mockdate.set('2021-10-20T00:00:00.000Z');
    const dccFakeRecovery = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_6.png'),
    );
    dccFakeRecovery.kid = 'jnFYIu1y3ic=';
    await verifyRulesFromCertificate(
      dccFakeRecovery, true,
      Validator.codes.VALID,
      '^Recovery statement is valid .*$',
    );
    mockdate.reset();
  });

  it('checks exemption certificates', async () => {
    const exemptionPayload = {
      e: [{
        df: '2021-02-15',
        du: '2021-12-15',
        co: 'IT',
        ci: 'TESTIDFAKEEXEMPTION#2',
        is: '',
        tg: '',
      }],
      nam: {
        fnt: 'UTENTE',
        fn: 'UTENTE',
        gnt: 'TEST',
        gn: 'TEST',
      },
      dob: '1955-01-20',
    };
    const dcc = dccToModel({ payload: exemptionPayload });
    mockdate.set('2021-02-14T12:34:56.000Z');
    await verifyRulesFromCertificate(
      dcc, false, Validator.codes.NOT_VALID_YET,
    );
    mockdate.set('2021-02-16T12:34:56.000Z');
    await verifyRulesFromCertificate(
      dcc, true, Validator.codes.VALID,
    );
    mockdate.set('2021-12-16T12:34:56.000Z');
    await verifyRulesFromCertificate(
      dcc, false, Validator.codes.NOT_VALID,
    );
    await verifyRulesFromCertificate(
      dcc, false, Validator.codes.TEST_NEEDED, null,
      Validator.mode.BOOSTER_DGP,
    );
    await verifyRulesFromCertificate(
      dcc, false, Validator.codes.NOT_VALID, null,
      Validator.mode.ENTRY_IT_DGP,
    );
    dcc.exemptions = [];
    await verifyRulesFromCertificate(
      dcc, false, Validator.codes.NOT_EU_DCC,
    );
    mockdate.reset();
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
      '^Not valid. Super DGP or Booster required.$',
      Validator.mode.SUPER_DGP,
    );
    // Doses 1/2 valid only in Italy
    mockdate.set('2021-06-24T00:00:00.000Z');
    await verifyRulesFromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_1.png'), true,
      Validator.codes.VALID,
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
    await verifyRulesFromCertificate(
      dccWithoutRecovery, false, Validator.codes.NOT_EU_DCC,
    );
    // Not valid greenpass without tests
    const dccWithoutTests = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_7.png'),
    );
    dccWithoutTests.tests = [];
    await verifyRulesFromCertificate(
      dccWithoutTests, false, Validator.codes.NOT_EU_DCC,
    );
    // Not valid greenpass without vaccinations
    const dccWithoutVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccWithoutVaccinations.vaccinations = [];
    await verifyRulesFromCertificate(
      dccWithoutVaccinations, false, Validator.codes.NOT_EU_DCC,
    );
    // Negative vaccination
    const dccWithNegativeVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccWithNegativeVaccinations.vaccinations[1].doseNumber = -1;
    await verifyRulesFromCertificate(
      dccWithNegativeVaccinations, false, Validator.codes.NOT_VALID,
    );
    // Malformed vaccination
    const dccWithMalformedVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccWithMalformedVaccinations.vaccinations[1].doseNumber = -1;
    await verifyRulesFromCertificate(
      dccWithMalformedVaccinations, false, Validator.codes.NOT_VALID,
    );
    mockdate.reset();
    mockdate.set('2021-08-15T12:34:56.000Z');
    // SM vaccination (Sputnik-V)
    const dccSMSputnikVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SM_1.png'),
    );
    await verifyRulesFromCertificate(
      dccSMSputnikVaccinations, true, Validator.codes.VALID,
    );
    mockdate.reset();
    // Other countries vaccination with Sputnik-V
    const dccITSputnikVaccinations = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SM_1.png'),
    );
    dccITSputnikVaccinations.vaccinations[0].countryOfVaccination = 'IT';
    await verifyRulesFromCertificate(
      dccITSputnikVaccinations, false, Validator.codes.NOT_VALID,
    );
    // Test fake tests
    const dccWithFakeTest = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_8.png'),
    );
    dccWithFakeTest.tests[0].typeOfTest = 'Fake';
    await verifyRulesFromCertificate(
      dccWithFakeTest, false, Validator.codes.NOT_VALID,
      '^Test type is not valid$',
    );
    // Test fake vaccinations
    const dccFakeVaccination = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SM_1.png'),
    );
    dccFakeVaccination.vaccinations[0].medicinalProduct = 'Fake';
    await verifyRulesFromCertificate(
      dccFakeVaccination, false, Validator.codes.NOT_VALID,
      '^Vaccine is not EMA$',
    );
    dccFakeVaccination.vaccinations[0].medicinalProduct = undefined;
    await verifyRulesFromCertificate(
      dccFakeVaccination, false, Validator.codes.NOT_VALID,
      '^Vaccine Type is empty$',
    );
    // Not EU DGC
    delete dccFakeVaccination.vaccinations;
    await verifyRulesFromCertificate(
      dccFakeVaccination, false, Validator.codes.NOT_EU_DCC,
      '^No vaccination, test, exemption or recovery statement found in payload$',
    );
    // Test booster in NORMAL_DGP mode
    mockdate.set('2021-06-18T00:00:00.000Z');
    const dccWithBooster = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccWithBooster.vaccinations[1].doseNumber = 3;
    await verifyRulesFromCertificate(
      dccWithBooster, true, Validator.codes.VALID,
    );
    mockdate.reset();
  });

  it('makes rules verification to travel to Italy (IT DL 4 Feb)', async () => {
    // Test not EMA in Entry Italy INVALID
    mockdate.set('2021-06-18T00:00:00.000Z');
    const dccNotEma = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccNotEma.vaccinations[1].medicinalProduct = 'Fake';
    await verifyRulesFromCertificate(
      dccNotEma, false, Validator.codes.NOT_VALID,
      null, Validator.mode.ENTRY_IT_DGP,
    );
    mockdate.reset();

    // Test Booster in Entry Italy VALID
    mockdate.set('2021-06-18T00:00:00.000Z');
    const dccWithBoosterEntry = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccWithBoosterEntry.vaccinations[1].doseNumber = 3;
    await verifyRulesFromCertificate(
      dccWithBoosterEntry, true, Validator.codes.VALID,
      null, Validator.mode.ENTRY_IT_DGP,
    );
    mockdate.reset();

    // Test Completed in Entry Italy VALID
    mockdate.set('2021-06-18T00:00:00.000Z');
    const dccCompleted = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    await verifyRulesFromCertificate(
      dccCompleted, true, Validator.codes.VALID,
      null, Validator.mode.ENTRY_IT_DGP,
    );
    mockdate.reset();

    // Test Not Completed in Entry Italy NOT VALID
    mockdate.set('2021-06-18T00:00:00.000Z');
    const dccNotCompleted = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccNotCompleted.vaccinations[1].doseNumber = 1;
    await verifyRulesFromCertificate(
      dccNotCompleted, false, Validator.codes.NOT_VALID,
      null, Validator.mode.ENTRY_IT_DGP,
    );
    mockdate.reset();
  });

  it('makes rules verification for super DGP mode (IT DL 4 Feb)', async () => {
    // Test Not Completed in super DGP VALID
    mockdate.set('2021-06-18T00:00:00.000Z');
    const dccNotCompleted = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccNotCompleted.vaccinations[1].doseNumber = 1;
    await verifyRulesFromCertificate(
      dccNotCompleted, true, Validator.codes.VALID,
      null, Validator.mode.SUPER_DGP,
    );
    mockdate.reset();

    // Test Not Completed in super DGP VALID
    mockdate.set('2021-06-18T00:00:00.000Z');
    dccNotCompleted.vaccinations[1].doseNumber = 1;
    dccNotCompleted.vaccinations[1].medicinalProduct = 'Fake';
    await verifyRulesFromCertificate(
      dccNotCompleted, false, Validator.codes.NOT_VALID,
      null, Validator.mode.SUPER_DGP,
    );
    mockdate.reset();

    // Test Booster not EMA in super DGP TEST_NEED
    mockdate.set('2021-06-18T00:00:00.000Z');
    dccNotCompleted.vaccinations[1].doseNumber = 3;
    dccNotCompleted.vaccinations[1].medicinalProduct = 'Fake';
    await verifyRulesFromCertificate(
      dccNotCompleted, false, Validator.codes.TEST_NEEDED,
      null, Validator.mode.SUPER_DGP,
    );
    mockdate.reset();

    // Test Completed not IT and not EMA in super DGP TEST_NEED
    mockdate.set('2021-06-18T00:00:00.000Z');
    dccNotCompleted.vaccinations[1].doseNumber = 2;
    dccNotCompleted.vaccinations[1].medicinalProduct = 'Fake';
    await verifyRulesFromCertificate(
      dccNotCompleted, false, Validator.codes.TEST_NEEDED,
      null, Validator.mode.SUPER_DGP,
    );
    mockdate.reset();

    // Test Completed IT in super DGP VALID
    mockdate.set('2021-06-18T00:00:00.000Z');
    dccNotCompleted.vaccinations[1].doseNumber = 2;
    dccNotCompleted.vaccinations[1].countryOfVaccination = 'IT';
    dccNotCompleted.vaccinations[1].medicinalProduct = 'EU/1/20/1507';
    await verifyRulesFromCertificate(
      dccNotCompleted, true, Validator.codes.VALID,
      null, Validator.mode.SUPER_DGP,
    );
    mockdate.reset();
  });

  it('makes rules verification for RSA Visitors (IT DL 4 Feb)', async () => {
    // Test Booster not EMA in super DGP TEST_NEED
    mockdate.set('2021-06-18T00:00:00.000Z');
    const dccNotCompleted = await Certificate.fromImage(
      path.join('test', 'data', 'eu_test_certificates', 'SK_3.png'),
    );
    dccNotCompleted.vaccinations[1].doseNumber = 3;
    dccNotCompleted.vaccinations[1].medicinalProduct = 'Fake';
    await verifyRulesFromCertificate(
      dccNotCompleted, false, Validator.codes.TEST_NEEDED,
      null, Validator.mode.VISITORS_RSA_DGP,
    );
    mockdate.reset();
  });
});
