const fs = require('fs');
const rs = require('jsrsasign');
const { CACHE_FOLDER } = require('./consts');

// Generic Type parameter
const GENERIC_TYPE = 'GENERIC';

// Test Result
const DETECTED = '260373001';

// Certificate Status
const NOT_GREEN_PASS = 'NOT_GREEN_PASS';
const NOT_VALID = 'NOT_VALID';
const NOT_VALID_YET = 'NOT_VALID_YET';
const VALID = 'VALID';
const PARTIALLY_VALID = 'PARTIALLY_VALID'; // only in Italy

const addDays = (date, days) => addHours(date, 24 * days);

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const checkVaccinations = (certificate, rules) => {
  try {
    const last = certificate.vaccinations[certificate.vaccinations.length - 1];
    const type = last.medicinalProduct;

    const vaccine_start_day_not_complete = findProperty(
      rules,
      'vaccine_start_day_not_complete',
      type,
    );
    const vaccine_end_day_not_complete = findProperty(
      rules,
      'vaccine_end_day_not_complete',
      type,
    );
    const vaccine_start_day_complete = findProperty(
      rules,
      'vaccine_start_day_complete',
      type,
    );
    const vaccine_end_day_complete = findProperty(
      rules,
      'vaccine_end_day_complete',
      type,
    );

    // Check vaccine type is in list
    if (!type || !vaccine_end_day_complete) return { code: NOT_VALID, message: 'Vaccine Type is not in list' };

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
      startDate = addDays(startDate, vaccine_start_day_not_complete.value);
      endDate = addDays(endDate, vaccine_end_day_not_complete.value);

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
      startDate = addDays(startDate, vaccine_start_day_complete.value);
      endDate = addDays(endDate, vaccine_end_day_complete.value);

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

    const rapid_test_start_hours = findProperty(rules, 'rapid_test_start_hours');
    const rapid_test_end_hours = findProperty(rules, 'rapid_test_end_hours');

    const last = certificate.tests[certificate.tests.length - 1];

    const now = new Date(Date.now());
    let startDate = new Date(Date.parse(last.dateTimeOfCollection));

    let endDate = new Date(Date.parse(last.dateTimeOfCollection));

    startDate = addHours(startDate, rapid_test_start_hours.value);
    endDate = addHours(endDate, rapid_test_end_hours.value);

    if (last.testResult == DETECTED) return { code: NOT_VALID, message: 'Test Result is DETECTED' };

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

const checkRecovery = (certificate, rules) => {
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

const findProperty = (rules, name, type) => rules.find((element) => {
  if (!type) type = GENERIC_TYPE;
  return element.name == name && element.type == type;
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

const checkRules = (certificate) => {
  const rules = JSON.parse(fs.readFileSync(`${CACHE_FOLDER}/rules.json`));

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
    result: result.code == VALID || result.code == PARTIALLY_VALID,
    code: result.code,
    message: result.message,
  };
};


async function checkSignature(dcc) {
  const signatureslist = JSON.parse(
    fs.readFileSync(`${CACHE_FOLDER}/signatureslist.json`),
  );
  const signatures = JSON.parse(fs.readFileSync(`${CACHE_FOLDER}/signatures.json`));
  for (key of signatureslist) {
    const signature = signatures[key];
    if (signature) {
      try {
        const verifier = rs.KEYUTIL.getKey(
          `-----BEGIN CERTIFICATE-----\n${signature}\n-----END CERTIFICATE-----`,
        ).getPublicKeyXYHex();
        verified = await dcc.checkSignature(verifier);
        if (verified) {
          break;
        }
      } catch (err) {
      }
    } else {
      // The signature list does not comply with the public key list (update problem?)
      console.log('Signature not found!!');
    }
  }
}

module.exports = { checkSignature, checkRules };
