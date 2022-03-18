import { Rule, Signatures, SignaturesList, CRL, Cache } from "./models";

declare module Service {
  var cache: Cache;
  function updateSignatures(): Promise<Signatures>;
  function updateSignaturesList(): Promise<SignaturesList>;
  function updateRules(): Promise<Rule[]>;
  function updateAll(crl?: CRL, cache?: Cache): Promise<void>;
  function setUp(crl?: CRL, cache?: Cache): Promise<void>;
  function tearDown(): Promise<void>;
}

export { Service }