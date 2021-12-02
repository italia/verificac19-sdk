import { RulesResult, DCCCertificate, ValidateGP } from "./models";

declare module Validator {
  function checkSignature(certificate: DCCCertificate): Promise<boolean>;
  function checkRules(certificate: DCCCertificate, mode?: Validator.mode): RulesResult;
  function validate(certificate: DCCCertificate, mode?: Validator.mode): Promise<ValidateGP>

  enum codes {
    VALID = "VALID",
    PARTIALLY_VALID = "PARTIALLY_VALID",
    NOT_VALID = "NOT_VALID",
    NOT_VALID_YET = "NOT_VALID_YET",
    NOT_EU_DCC = "NOT_EU_DCC"
  }

  enum mode {
    SUPER_DGP = '2G',
    NORMAL_DGP = '3G'
  }
}

export { Validator }
