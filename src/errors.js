class GenericError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class CertificateParsingError extends GenericError {
  constructor(error) {
    super(`certificate can't be parsed, ${error.message}`);
    this.data = { error };
  }
}

class CertificateVerificationError extends GenericError {
  constructor(error) {
    super(`certificate can't be verified, ${error.message}`);
    this.data = { error };
  }
}

module.exports = {
  GenericError,
  CertificateVerificationError,
  CertificateParsingError,
};
