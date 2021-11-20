/**
 * The shape of a Vaccine
 */
export interface Vaccine {
  disease: string;
  vaccine: string;
  medicinalProduct: string;
  manufacturer: string;
  doseNumber: number;
  totalSeriesOfDoses: number;
  dateOfVaccination: string;
  countryOfVaccination: string;
  certificateIssuer: string;
  certificateIdentifier: string;
}
