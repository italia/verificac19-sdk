import { Person, Recovery, Test, Vaccine } from "./";

/**
 * The shape of the payload of a GP
 */
export interface DCCPayload {
  dob: string;
  nam: {
    fn: string;
    fnt: string;
    gn: string;
    gnt: string;
  };
  r?: Recovery[];
  t?: Test[];
  v?: Vaccine[];
  ver: string;
}

/**
 * The shape of the Certificate for the fromImage and fromRaw functions
 */
export interface DCCCertificate {
  person: Person;
  dateOfBirth: string;
  vaccinations: Vaccine[];
  tests: Test[];
  recoveryStatements: Recovery[];
  dcc: DCCPayload
  kid: string;
}
