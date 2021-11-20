import { RulesResult, DCCCertificate } from "./models";

declare namespace Validator {
  function checkSignature(certificate: DCCCertificate): Promise<boolean>;
  function checkRules(certificate: DCCCertificate): RulesResult;

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
