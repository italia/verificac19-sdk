import { Rule, Signatures, SignaturesList } from "./models";

declare module Service {
  function updateSignatures(): Promise<Signatures>;
  function updateSignaturesList(): Promise<SignaturesList>;
  function updateRules(): Promise<Rule[]>;
  function updateAll(): Promise<void>;
}

export { Service }
