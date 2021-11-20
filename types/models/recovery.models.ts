/**
 * The shape of a Recovery
 */
export interface Recovery {
  disease: string;
  dateOfFirstPositiveTest: string;
  countryOfVaccination: string;
  certificateIssuer: string;
  certificateValidFrom: string;
  certificateValidUntil: string;
  certificateIdentifier: string;
}
