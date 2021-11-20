/**
 * The shape of a Test
 */
export interface Test {
  disease: string;
  typeOfTest: string;
  testName: string;
  testNameAndManufacturer: null;
  dateTimeOfCollection: string;
  dateTimeOfTestResult: null;
  testResult: string;
  testingCentre: string;
  countryOfVaccination: string;
  certificateIssuer: string;
  certificateIdentifier: string;
}
