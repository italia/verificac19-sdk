const rs = require('jsrsasign');
const cache = require('./cache');

// Generic Type parameter
const GENERIC_TYPE = 'GENERIC';

// Test Result
const DETECTED = '260373001';

// Certificate Status
const NOT_GREEN_PASS = 'NOT_GREEN_PASS';
const NOT_VALID = 'NOT_VALID';
const NOT_VALID_YET = 'NOT_VALID_YET';
const VALID = 'VALID';
const INVALID = 'INVALID';
const PARTIALLY_VALID = 'PARTIALLY_VALID'; // only in Italy

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

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const addDays = (date, days) => addHours(date, 24 * days);

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
    if (!type || !vaccineEndDayComplete) return { code: NOT_VALID, message: 'Vaccine Type is not in list' };

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
        code: INVALID,
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
    console.log(err);
    return {
      code: NOT_GREEN_PASS,
      message:
        `Vaccination is not present or is not a green pass : ${err.toString()}`,
    };
  }
};

const checkTests = (certificate, rules) => {
  try {
    // Not used (weird)
    /* let molecular_test_start_hours = findProperty(
      rules,
      "molecular_test_start_hours"
    );

    let molecular_test_end_hours = findProperty(
      rules,
      "molecular_test_end_hours"
    ); */

    const rapidTestStartHours = findProperty(rules, 'rapid_test_start_hours');
    const rapidTestEndHours = findProperty(rules, 'rapid_test_end_hours');

    const last = certificate.tests[certificate.tests.length - 1];

    const now = new Date(Date.now());
    let startDate = new Date(Date.parse(last.dateTimeOfCollection));

    let endDate = new Date(Date.parse(last.dateTimeOfCollection));

    startDate = addHours(startDate, rapidTestStartHours.value);
    endDate = addHours(endDate, rapidTestEndHours.value);

    if (last.testResult === DETECTED) return { code: NOT_VALID, message: 'Test Result is DETECTED' };

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
    console.log(err);
    return {
      code: NOT_GREEN_PASS,
      message:
        `Test Result is not present or is not a green pass : ${err.toString()}`,
    };
  }
};

const checkRecovery = (certificate) => {
  try {
    // Not used (weird)
    // let recovery_cert_start_day = findProperty(rules, "recovery_cert_start_day");
    // let recovery_cert_end_day = findProperty(rules, "recovery_cert_end_day");

    const last = certificate.recoveryStatements[certificate.recoveryStatements.length - 1];

    const now = new Date(Date.now());
    const startDate = new Date(
      Date.parse(clearExtraTime(last.certificateValidFrom)),
    );
    const endDate = new Date(
      Date.parse(clearExtraTime(last.certificateValidUntil)),
    );

    if (startDate > now) {
      return {
        code: NOT_VALID_YET,
        message:
          `Recovery statement is not valid yet, starts at : ${
            startDate.toISOString()}`,
      };
    }

    if (now > endDate) {
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
    console.log(err);
    return {
      code: NOT_GREEN_PASS,
      message: `Recovery statement is not present or is not a green pass : ${err.toString()}`,
    };
  }
};

const checkRules = (certificate) => {
  const rules = cache.getRules();

  let result;

  if (certificate.vaccinations) {
    result = checkVaccinations(certificate, rules);
  }

  if (certificate.tests) {
    result = checkTests(certificate, rules);
  }

  if (certificate.recoveryStatements) {
    result = checkRecovery(certificate, rules);
  }

  if (!result) {
    return {
      result: false,
      code: NOT_GREEN_PASS,
      message: 'No vaccination, test or recovery statement found in payload',
    };
  }

  return {
    result: result.code === VALID || result.code === PARTIALLY_VALID,
    code: result.code,
    message: result.message,
  };
};

async function checkSignature(dcc) {
  const signatureslist = cache.getSignatureList();
  const signatures = cache.getSignatures();
  for (const key of signatureslist) {
    const signature = signatures[key];
    if (signature) {
      try {
        const verifier = rs.KEYUTIL.getKey(
          `-----BEGIN CERTIFICATE-----\n${signature}\n-----END CERTIFICATE-----`,
        ).getPublicKeyXYHex();
        const verified = await dcc.checkSignature(verifier);
        if (verified) {
          break;
        }
      } catch (err) {
        throw new Error(err);
      }
    } else {
      // The signature list does not comply with the public key list (update problem?)
      console.log('Signature not found!!');
    }
  }
}

module.exports = { checkSignature, checkRules };
