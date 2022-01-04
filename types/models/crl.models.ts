export interface CRL {
  
  /**
   * Setup your CRL here (database/file init)
   */
  setUp(): Promise<void>;
  
  /**
   * Store `revokedUvci` elements and remove `deletedRevokedUvci` elements
   */
  storeRevokedUVCI(revokedUvci?: string[], deletedRevokedUvci?: string[]): Promise<void>;
  
  /**
   * Return true if `uvci` is present (UVCI revoked), false otherwise
   */
  isUVCIRevoked(uvci: string): Promise<Boolean>;

  /**
   * Clean data from CRL
   */
  clean(): Promise<void>;

  /**
   * Close your db, clean CRL resources ...
   */
  tearDown(): Promise<void>;

}
