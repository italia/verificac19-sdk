import { RulesResult, DCCCertificate, ValidateGP } from "./models";

declare module Validator {
  function checkSignature(certificate: DCCCertificate): Promise<boolean>;
  function checkRules(certificate: DCCCertificate): RulesResult;
  function validate(certificate: DCCCertificate): Promise<ValidateGP>

  namespace codes {
    const VALID: "VALID";
    const PARTIALLY_VALID: "PARTIALLY_VALID";
    const NOT_VALID: "NOT_VALID";
    const NOT_VALID_YET: "NOT_VALID_YET";
    const NOT_EU_DCC: "NOT_EU_DCC";

    export { VALID, PARTIALLY_VALID, NOT_VALID, NOT_VALID_YET, NOT_EU_DCC };
  }
}

export { Validator }
