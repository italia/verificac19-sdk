/**
 * The shape of the validator function
 */
export interface ValidateGP {
  person: string,
  date_of_birth: string,
  code: 'VALID' | 'PARTIALLY_VALID' | 'NOT_VALID' | 'NOT_VALID_YET' | 'NOT_EU_DCC',
  result: boolean,
  message: string
}
