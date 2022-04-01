import { DCCCertificate, RulesResult, ValidateGP } from "./models";

declare module Validator {
  function checkSignature(certificate: DCCCertificate): Promise<boolean>;
  function checkRules(certificate: DCCCertificate, mode?: Validator.mode): RulesResult;
  function validate(certificate: DCCCertificate, mode?: Validator.mode): Promise<ValidateGP>

  enum codes {
    VALID = "VALID",
    NOT_VALID = "NOT_VALID",
    NOT_VALID_YET = "NOT_VALID_YET",
    NOT_EU_DCC = "NOT_EU_DCC",
    REVOKED = 'REVOKED',
    TEST_NEEDED = 'TEST_NEEDED'
    
  }

  enum mode {
    SUPER_DGP = "2G",
    NORMAL_DGP = "3G",
    BOOSTER_DGP = "BOOSTER",
    VISITORS_RSA_DGP = BOOSTER_DGP,
    ENTRY_IT_DGP = "ENTRY_IT",
  }
}

export { Validator };

