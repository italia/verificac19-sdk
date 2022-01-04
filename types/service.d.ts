import { Rule, Signatures, SignaturesList, CRL } from "./models";

declare module Service {
  function updateSignatures(): Promise<Signatures>;
  function updateSignaturesList(): Promise<SignaturesList>;
  function updateRules(): Promise<Rule[]>;
  function updateAll(crl?: CRL): Promise<void>;
  function setUp(crl?: CRL): Promise<void>;
  function tearDown(): Promise<void>;
}

export { Service }
