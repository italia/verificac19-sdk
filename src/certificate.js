const { DCC } = require('dcc-utils');
const { CertificateParsingError } = require('./errors');

const dccToModel = (dcc) => {
  const { payload } = dcc;
  const { kid } = dcc;
  const dateOfBirth = payload.dob;

  const person = {
    standardisedFamilyName: payload.nam.fnt,
    familyName: payload.nam.fn,
    standardisedGivenName: payload.nam.gnt,
    givenName: payload.nam.gn,
  };

  const vList = payload.v;
  const rList = payload.r;
  const tList = payload.t;
  const eList = payload.e;

  let exemptions;
  if (eList && eList.length > 0) {
    exemptions = [];
    for (const e of eList) {
      const object = {
        disease: e.tg,
        certificateValidFrom: e.df,
        certificateValidUntil: e.du,
        countryOfVaccination: e.co,
        certificateIssuer: e.is,
        certificateIdentifier: e.ci,
      };
      exemptions.push(object);
    }
  }

  let vaccinations;
  if (vList && vList.length > 0) {
    vaccinations = [];
    for (const v of vList) {
      const object = {
        disease: v.tg,
        vaccine: v.vp,
        medicinalProduct: v.mp,
        manufacturer: v.ma,
        doseNumber: v.dn,
        totalSeriesOfDoses: v.sd,
        dateOfVaccination: v.dt,
        countryOfVaccination: v.co,
        certificateIssuer: v.is,
        certificateIdentifier: v.ci,
      };
      vaccinations.push(object);
    }
  }

  let tests;
  if (tList && tList.length > 0) {
    tests = [];
    for (const t of tList) {
      const object = {
        disease: t.tg,
        typeOfTest: t.tt,
        testName: t.nm,
        testNameAndManufacturer: null,
        dateTimeOfCollection: t.sc,
        dateTimeOfTestResult: null,
        testResult: t.tr,
        testingCentre: t.tc,
        countryOfVaccination: t.co, // country of test
        certificateIssuer: t.is,
        certificateIdentifier: t.ci,
      };
      tests.push(object);
    }
  }

  let recoveryStatements;
  if (rList && rList.length > 0) {
    recoveryStatements = [];
    for (const r of rList) {
      const object = {
        disease: r.tg,
        dateOfFirstPositiveTest: r.fr,
        countryOfVaccination: r.co, // country of test
        certificateIssuer: r.is,
        certificateValidFrom: r.df,
        certificateValidUntil: r.du,
        certificateIdentifier: r.ci,
      };
      recoveryStatements.push(object);
    }
  }

  return {
    person,
    dateOfBirth,
    vaccinations,
    tests,
    recoveryStatements,
    exemptions,
    dcc,
    kid,
  };
};

const fromImage = async (path) => {
  try {
    const dcc = await DCC.fromImage(path);
    return dccToModel(dcc);
  } catch (error) {
    throw new CertificateParsingError(error);
  }
};

const fromRaw = async (payload) => {
  try {
    const dcc = await DCC.fromRaw(payload);
    return dccToModel(dcc);
  } catch (error) {
    throw new CertificateParsingError(error);
  }
};

module.exports = { fromImage, fromRaw };
