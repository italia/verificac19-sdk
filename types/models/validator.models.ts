/**
 * The shape of the validator function
 */
export interface ValidateGP {
  person: string,
  date_of_birth: string,
  code: 'VALID' | 'NOT_VALID' | 'NOT_VALID_YET' | 'NOT_EU_DCC' | 'REVOKED' | 'TEST_NEEDED',
  result: boolean,
  message: string
}
