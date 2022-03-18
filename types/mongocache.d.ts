import { Cache, CRLStatus, Rule, Signatures, SignaturesList } from './models'

export class MongoCache implements Cache {
  cleanRules(): Promise<void>;
  cleanSignatures(): Promise<void>;
  cleanSignaturesList(): Promise<void>;
  cleanAll(): Promise<void>;
  setUp(): Promise<void>;
  checkCacheManagerSetUp(): Promise<void>;
  checkCrlManagerSetUp(): Promise<void>;
  isReady(): Promise<boolean>;
  storeCRLStatus(chunk: Number, totalChunk: Number, version: Number, targetVersion: Number): Promise<void>;
  storeRules(data: String): Promise<void>;
  storeSignaturesList(data: String): Promise<void>;
  storeSignatures(data: String): Promise<void>;
  storeCRLRevokedUVCI(revokedUvci: String[], deletedRevokedUvci: String[]): Promise<void>;
  getCRLStatus(): Promise<CRLStatus>;
  getRules(): Promise<Rule[]>;
  getSignatureList(): Promise<Signatures[]>;
  getSignatures(): Promise<SignaturesList>;
  needCRLUpdate(): Promise<boolean>;
  needRulesUpdate(): Promise<boolean>;
  needSignaturesUpdate(): Promise<boolean>;
  needSignaturesListUpdate(): Promise<boolean>;
  isUVCIRevoked(uvci: String): Promise<boolean>;
  tearDown(): Promise<void>;
  cleanCRL(): Promise<void>;
}