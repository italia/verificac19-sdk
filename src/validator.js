const cache = require('./cache');
const { addHours, addDays } = require('./utils');

// Generic Type parameter
const GENERIC_TYPE = 'GENERIC';

// Test Result
const TEST_DETECTED = '260373001';

// Test Types
const TEST_RAPID = 'LP217198-3';
const TEST_MOLECULAR = 'LP6464-4';

// Certificate Status
const NOT_EU_DCC = 'NOT_EU_DCC';
const NOT_VALID = 'NOT_VALID';
const NOT_VALID_YET = 'NOT_VALID_YET';
const VALID = 'VALID';
const PARTIALLY_VALID = 'PARTIALLY_VALID'; // only in Italy

// Validation mode

const SUPER_DGP = '2G';
const NORMAL_DGP = '3G';

const codes = {
  VALID,
  PARTIALLY_VALID,
  NOT_VALID,
  NOT_VALID_YET,
  NOT_EU_DCC,
};

const modalities = {
  SUPER_DGP,
  NORMAL_DGP,
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
  } catch (e) {
    return strDateTime;
  }
};

const checkVaccinations = (certificate, rules) => {
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

    // Check vaccine type is in list
    if (type === 'Sputnik-V' && last.countryOfVaccination !== 'SM') {
      return {
        code: NOT_VALID,
        message: 'Vaccine Sputnik-V is valid only in San Marino',
      };
    }
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
        code: PARTIALLY_VALID,
        message:
          `${doses
          } - Vaccination is valid (only in Italy) [ ${
            startDate.toISOString()
          } - ${
            endDate.toISOString()
          } ] `,
      };
    }

    if (last.doseNumber >= last.totalSeriesOfDoses) {
      startDate = addDays(startDate, vaccineStartDayComplete.value);
      endDate = addDays(endDate, vaccineEndDayComplete.value);

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

const checkTests = (certificate, rules) => {
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

const checkRecovery = (certificate, rules) => {
  try {
    const recoveryCertStartDay = findProperty(rules, 'recovery_cert_start_day');
    const recoveryCertEndDay = findProperty(rules, 'recovery_cert_end_day');

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

    if (now > endDate) {
      return {
        code: PARTIALLY_VALID,
        message: `Recovery statement is partially valid. It will be expired at : ${endDate.toISOString()}`,
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

const checkUVCI = (r, UVCIList) => {
  if (r) {
    for (const op of r) {
      if (UVCIList.includes(op.certificateIdentifier)) {
        return false;
      }
    }
  }
  return true;
};

const checkRules = (certificate, mode = NORMAL_DGP) => {
  const rules = cache.getRules();
  const UVCIList = findProperty(
    rules,
    'black_list_uvci',
    'black_list_uvci',
  ).value.split(';').filter((uvci) => uvci !== '');

  let result;

  if (certificate.vaccinations && checkUVCI(certificate.vaccinations, UVCIList)) {
    result = checkVaccinations(certificate, rules);
  }

  if (certificate.tests && checkUVCI(certificate.tests, UVCIList)) {
    if (mode === SUPER_DGP) {
      return {
        result: false,
        code: NOT_VALID,
        message: 'Not valid. Super DGP required.',
      };
    }
    result = checkTests(certificate, rules);
  }

  if (certificate.recoveryStatements && checkUVCI(certificate.recoveryStatements, UVCIList)) {
    result = checkRecovery(certificate, rules);
  }

  if (!result) {
    return {
      result: false,
      code: NOT_EU_DCC,
      message: 'No vaccination, test or recovery statement found in payload or UVCI is in blacklist',
    };
  }

  return {
    result: result.code === VALID || result.code === PARTIALLY_VALID,
    code: result.code,
    message: result.message,
  };
};

async function checkSignature(certificate) {
  const signaturesList = cache.getSignatureList();
  const signatures = cache.getSignatures();
  let verified = false;
  if (certificate.kid && signaturesList.includes(certificate.kid)) {
    try {
      verified = await certificate.dcc.checkSignatureWithCertificate(signatures[certificate.kid]);
    } catch (err) {
      // invalid signature or key, return false
    }
  }

  return !!verified;
}

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
  const rulesResult = checkRules(certificate, mode);
  const signatureOk = await checkSignature(certificate);
  return buildResponse(certificate, rulesResult, signatureOk);
}

module.exports = {
  checkSignature, checkRules, validate, codes, mode: modalities,
};
