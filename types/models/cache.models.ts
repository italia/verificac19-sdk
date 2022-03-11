import { CRLStatus, Rule, Signatures, SignaturesList } from ".";

export interface Cache {
    /**
    * Setup your Cache here (database/file init)
    */
    setUp(): Promise<void>;

    /**
    * Check if the Cache Manager is set up
    */
    checkCacheManagerSetUp(): Promise<void>;

    /**
    * Check if the CRL Manager is set up
    */
    checkCrlManagerSetUp(): Promise<void>;

    /**
    * Check if the Cache Manager is ready
    */
    isReady(): Promise<boolean>;

    /**
    * Store the CRL status
    */
    storeCRLStatus(chunk: Number, totalChunk: Number, version: Number, targetVersion: Number): Promise<void>;

    /**
    * Store the Rules
    */
    storeRules(data: String): Promise<void>;

    /**
    * Store the Signatures List
    */
    storeSignaturesList(data: String): Promise<void>;

    /**
    * Store the Signatures
    */
    storeSignatures(data: String): Promise<void>;

    /**
    * Store the downlaoded UVCI
    */
    storeCRLRevokedUVCI(revokedUvci: Array<String>, deletedRevokedUvci: Array<String>): Promise<void>

    /**
    * Get the CRL Status
    */
    getCRLStatus(): Promise<CRLStatus>;

    /**
    * Get the rules
    */
    getRules(): Promise<Array<Rule>>;

    /**
    * Get the signature list
    */
    getSignatureList(): Promise<Array<Signatures>>;

    /**
    * Get the signatures
    */
    getSignatures(): Promise<SignaturesList>;

    /**
    * Check if the CRL needs to be updated
    */
    needCRLUpdate(): Promise<boolean>;

    /**
    * Check if the Rules needs to be updated
    */
    needRulesUpdate(): Promise<boolean>;

    /**
    * Check if the Signatures needs to be updated
    */
    needSignaturesUpdate(): Promise<boolean>;

    /**
    * Check if the Signature list needs to be updated
    */
    needSignaturesListUpdate(): Promise<boolean>;

    /**
    * Check if the UVCI is revoked
    */
    isUVCIRevoked(uvci: String): Promise<boolean>;

    /**
    * Close all connections
    */
    tearDown(): Promise<void>;

    /**
    * Clean the CRL
    */
    cleanCRL(): Promise<void>;


}