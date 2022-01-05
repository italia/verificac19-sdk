const rs = require('jsrsasign');
const cache = require('./cache');
const { addHours, addDays } = require('./utils');
const { CertificateVerificationError } = require('./errors');

// Generic Type parameter
const GENERIC_TYPE = 'GENERIC';

// Test Result
const TEST_DETECTED = '260373001';

// Test Types
const TEST_RAPID = 'LP217198-3';
const TEST_MOLECULAR = 'LP6464-4';

// Vaccine Types
const JOHNSON = 'EU/1/20/1525';
const SPUTNIK = 'Sputnik-V';

// OID Recovery Types
const OID_RECOVERY = '1.3.6.1.4.1.1847.2021.1.3';
const OID_ALT_RECOVERY = '1.3.6.1.4.1.0.1847.2021.1.3';

// Countries
const ITALY = 'IT';
const SAN_MARINO = 'SM';

// Certificate Status
const NOT_EU_DCC = 'NOT_EU_DCC';
const NOT_VALID = 'NOT_VALID';
const NOT_VALID_YET = 'NOT_VALID_YET';
const VALID = 'VALID';
const REVOKED = 'REVOKED';
const TEST_NEEDED = 'TEST_NEEDED';

// Validation mode
const SUPER_DGP = '2G';
const NORMAL_DGP = '3G';
const BOOSTER_DGP = 'BOOSTER';

const codes = {
  VALID,
  NOT_VALID,
  NOT_VALID_YET,
  NOT_EU_DCC,
  REVOKED,
  TEST_NEEDED,
};

const modalities = {
  SUPER_DGP,
  NORMAL_DGP,
  BOOSTER_DGP,
};

const findProperty = (rules, name, type) => rules.find((element) => {
  const propertyType = !type ? GENERIC_TYPE : type;
  return element.name === name && element.type === propertyType;
});

const clearExtraTime = (strDateTime) => {
  try {
    if (strDateTime.contains('T')) {
      return strDateTime.substring(0, strDateTime.indexOf('T'));
    }
    return strDateTime;
  } catch {
    return strDateTime;
  }
};

const getInfoFromCertificate = (certificate) => {
  const signatures = cache.getSignatures();
  const info = { country: null, oid: null };
  try {
    const x509 = new rs.X509();
    x509.readCertPEM(signatures[certificate.kid]);
    const certIssuer = x509.getIssuer().array[0].find((el) => el.type === 'C');
    const country = certIssuer ? certIssuer.value : null;
    const extendedKeyUsage = country === ITALY ? x509.getExtExtKeyUsageName() : null;
    info.country = country;
    info.oid = extendedKeyUsage ? extendedKeyUsage[0] : null;
  } catch {
    // Possible error parsing certificate
  }
  return info;
};

const checkVaccinations = (certificate, rules, mode) => {
  try {
    const last = certificate.vaccinations[certificate.vaccinations.length - 1];
    const type = last.medicinalProduct;

    const vaccineStartDayNotComplete = findProperty(
      rules,
      'vaccine_start_day_not_complete',
      type,
    );
    const vaccineEndDayNotComplete = findProperty(
      rules,
      'vaccine_end_day_not_complete',
      type,
    );
    const vaccineStartDayComplete = findProperty(
      rules,
      'vaccine_start_day_complete',
      type,
    );
    const vaccineEndDayComplete = findProperty(
      rules,
      'vaccine_end_day_complete',
      type,
    );

    // Check San Marino case
    if (type === SPUTNIK && last.countryOfVaccination !== SAN_MARINO) {
      return {
        code: NOT_VALID,
        message: 'Vaccine Sputnik-V is valid only in San Marino',
      };
    }
    // Check vaccine type is in list
    if (!type || !vaccineEndDayComplete) {
      return {
        code: NOT_VALID,
        message: 'Vaccine Type is not in list',
      };
    }
    const startNow = new Date(Date.now());
    const endNow = new Date(Date.now());

    startNow.setUTCHours(0, 0, 0, 0);
    endNow.setUTCHours(23, 59, 59, 999);

    let startDate = new Date(
      Date.parse(clearExtraTime(last.dateOfVaccination)),
    );
    let endDate = new Date(Date.parse(clearExtraTime(last.dateOfVaccination)));

    const doses = `Doses ${last.doseNumber}/${last.totalSeriesOfDoses}`;

    if (last.doseNumber <= 0) {
      return {
        code: NOT_VALID,
        message: `${doses} - Invalid number of doses`,
      };
    }

    if (last.doseNumber < last.totalSeriesOfDoses) {
      if (mode === BOOSTER_DGP) {
        return {
          code: NOT_VALID,
          message: 'Vaccine is not valid in Booster mode',
        };
      }

      startDate = addDays(startDate, vaccineStartDayNotComplete.value);
      endDate = addDays(endDate, vaccineEndDayNotComplete.value);

      if (startDate > endNow) {
        return {
          code: NOT_VALID_YET,
          message:
            `${doses
            } - Vaccination is not valid yet, starts at : ${
              startDate.toISOString()}`,
        };
      }

      if (startNow > endDate) {
        return {
          code: NOT_VALID,
          message:
            `${doses} - Vaccination is expired at : ${endDate.toISOString()}`,
        };
      }

      return {
        code: VALID,
        message:
          `${doses
          } - Vaccination is valid [ ${
            startDate.toISOString()
          } - ${
            endDate.toISOString()
          } ] `,
      };
    }

    if (last.doseNumber >= last.totalSeriesOfDoses) {
      startDate = addDays(startDate, vaccineStartDayComplete.value);
      endDate = addDays(endDate, vaccineEndDayComplete.value);
      if ((type === JOHNSON) && ((last.doseNumber > last.totalSeriesOfDoses) || (last.doseNumber === last.totalSeriesOfDoses && last.doseNumber >= 2))) {
        startDate = new Date(
          Date.parse(clearExtraTime(last.dateOfVaccination)),
        );
      }

      if (startDate > endNow) {
        return {
          code: NOT_VALID_YET,
          message:
            `Doses ${
              last.doseNumber
            }/${
              last.totalSeriesOfDoses
            } - Vaccination is not valid yet, starts at : ${
              startDate.toISOString()}`,
        };
      }

      if (startNow > endDate) {
        return {
          code: NOT_VALID,
          message:
            `Doses ${
              last.doseNumber
            }/${
              last.totalSeriesOfDoses
            } - Vaccination is expired at : ${
              endDate.toISOString()}`,
        };
      }
      // Check completed cycle without booster
      if (mode === BOOSTER_DGP) {
        if (type === JOHNSON) {
          if (last.doseNumber === last.totalSeriesOfDoses && last.doseNumber < 2) {
            return {
              code: TEST_NEEDED,
              message: 'Test needed',
            };
          }
        } else if (last.doseNumber === last.totalSeriesOfDoses && last.doseNumber < 3) {
          return {
            code: TEST_NEEDED,
            message: 'Test needed',
          };
        }
      }
      return {
        code: VALID,
        message:
          `${doses
          } - Vaccination is valid [ ${
            startDate.toISOString()
          } - ${
            endDate.toISOString()
          } ] `,
      };
    }

    return { code: NOT_VALID, message: 'Vaccination format is invalid' };
  } catch (err) {
    return {
      code: NOT_EU_DCC,
      message:
        `Vaccination is not present or is not a green pass : ${err.toString()}`,
    };
  }
};

const checkTests = (certificate, rules, mode) => {
  if (mode !== NORMAL_DGP) {
    return {
      result: false,
      code: NOT_VALID,
      message: 'Not valid. Super DGP or Booster required.',
    };
  }
  try {
    let testStartHours;
    let testEndHours;

    const last = certificate.tests[certificate.tests.length - 1];
    if (last.typeOfTest === TEST_MOLECULAR) {
      testStartHours = findProperty(rules, 'molecular_test_start_hours');
      testEndHours = findProperty(rules, 'molecular_test_end_hours');
    } else if (last.typeOfTest === TEST_RAPID) {
      testStartHours = findProperty(rules, 'rapid_test_start_hours');
      testEndHours = findProperty(rules, 'rapid_test_end_hours');
    } else {
      return { code: NOT_VALID, message: 'Test type is not valid' };
    }

    const now = new Date(Date.now());
    let startDate = new Date(Date.parse(last.dateTimeOfCollection));
    let endDate = new Date(Date.parse(last.dateTimeOfCollection));

    startDate = addHours(startDate, testStartHours.value);
    endDate = addHours(endDate, testEndHours.value);

    if (last.testResult === TEST_DETECTED) return { code: NOT_VALID, message: 'Test Result is DETECTED' };

    if (startDate > now) {
      return {
        code: NOT_VALID_YET,
        message:
          `Test Result is not valid yet, starts at : ${
            startDate.toISOString()}`,
      };
    }

    if (now > endDate) {
      return {
        code: NOT_VALID,
        message: `Test Result is expired at : ${endDate.toISOString()}`,
      };
    }

    return {
      code: VALID,
      message:
        `Test Result is valid [ ${
          startDate.toISOString()
        } - ${
          endDate.toISOString()
        } ] `,
    };
  } catch (err) {
    return {
      code: NOT_EU_DCC,
      message:
        `Test Result is not present or is not a green pass : ${err.toString()}`,
    };
  }
};

const checkRecovery = (certificate, rules, mode) => {
  try {
    if (mode === BOOSTER_DGP) {
      return {
        code: TEST_NEEDED,
        message: 'Test needed',
      };
    }

    const certificateInfo = getInfoFromCertificate(certificate);
    const isRecoveryBis = certificateInfo.country === ITALY && [OID_RECOVERY, OID_ALT_RECOVERY].includes(certificateInfo.oid);
    const recoveryCertStartDay = findProperty(rules, isRecoveryBis ? 'recovery_pv_cert_start_day' : 'recovery_cert_start_day');
    const recoveryCertEndDay = findProperty(rules, isRecoveryBis ? 'recovery_pv_cert_end_day' : 'recovery_cert_end_day');

    const last = certificate.recoveryStatements[certificate.recoveryStatements.length - 1];

    const now = new Date(Date.now());
    const startDate = new Date(
      Date.parse(clearExtraTime(last.certificateValidFrom)),
    );
    const endDate = new Date(
      Date.parse(clearExtraTime(last.certificateValidUntil)),
    );

    const startDateValidation = addDays(startDate, recoveryCertStartDay.value);

    if (startDateValidation > now) {
      return {
        code: NOT_VALID_YET,
        message:
          `Recovery statement is not valid yet, starts at : ${
            startDate.toISOString()}`,
      };
    }

    if (now > addDays(startDateValidation, recoveryCertEndDay.value)) {
      return {
        code: NOT_VALID,
        message: `Recovery statement is expired at : ${endDate.toISOString()}`,
      };
    }

    return {
      code: VALID,
      message:
        `Recovery statement is valid [ ${
          startDate.toISOString()
        } - ${
          endDate.toISOString()
        } ] `,
    };
  } catch (err) {
    return {
      code: NOT_EU_DCC,
      message: `Recovery statement is not present or is not a green pass : ${err.toString()}`,
    };
  }
};

const checkUVCI = async (r, UVCIList) => {
  if (r) {
    for (const op of r) {
      if (UVCIList.includes(op.certificateIdentifier)) {
        return false;
      }
      if (await cache.isUVCIRevoked(op.certificateIdentifier)) {
        return false;
      }
    }
  }
  return true;
};

const checkCacheIsReady = () => {
  if (!cache.isReady()) {
    throw new CertificateVerificationError('Cache is not ready!');
  }
};

const checkRules = async (certificate, mode = NORMAL_DGP) => {
  checkCacheIsReady();
  const rules = cache.getRules();
  const UVCIList = findProperty(
    rules,
    'black_list_uvci',
    'black_list_uvci',
  ).value.split(';').filter((uvci) => uvci !== '');

  const isRevoked = !await checkUVCI(certificate.vaccinations || certificate.tests || certificate.recoveryStatements, UVCIList);

  if (isRevoked) {
    return {
      result: false,
      code: REVOKED,
      message: 'UVCI is in blacklist',
    };
  }

  let result;

  if (certificate.vaccinations) {
    result = checkVaccinations(certificate, rules, mode);
  } else if (certificate.tests) {
    result = checkTests(certificate, rules, mode);
  } else if (certificate.recoveryStatements) {
    result = checkRecovery(certificate, rules, mode);
  } else {
    return {
      result: false,
      code: NOT_EU_DCC,
      message: 'No vaccination, test or recovery statement found in payload',
    };
  }

  return {
    result: result.code === VALID,
    code: result.code,
    message: result.message,
  };
};

const checkSignature = async (certificate) => {
  checkCacheIsReady();
  const signaturesList = cache.getSignatureList();
  const signatures = cache.getSignatures();
  let verified = false;
  if (certificate.kid && signaturesList.includes(certificate.kid)) {
    try {
      verified = await certificate.dcc.checkSignatureWithCertificate(signatures[certificate.kid]);
    } catch {
      // invalid signature or key, return false
    }
  }
  return !!verified;
};

const buildResponse = (certificate, rulesResult, signatureOk) => {
  let motivation = rulesResult;
  if (!signatureOk) {
    motivation = {
      code: NOT_VALID,
      result: false,
      message: 'Invalid signature',
    };
  }
  return {
    person: certificate.person ? `${certificate.person.givenName} ${certificate.person.familyName}` : null,
    date_of_birth: certificate.dateOfBirth ? certificate.dateOfBirth : null,
    ...motivation,
  };
};

async function validate(certificate, mode = NORMAL_DGP) {
  const signatureOk = await checkSignature(certificate);
  const rulesResult = await checkRules(certificate, mode);
  return buildResponse(certificate, rulesResult, signatureOk);
}

module.exports = {
  checkSignature, checkRules, validate, codes, mode: modalities,
};
