import { DCCCertificate } from "./models";

declare module Certificate {
  function fromImage(path: string | Buffer | URL): Promise<DCCCertificate>;
  function fromRaw(payload: string): Promise<DCCCertificate>;
}

export { Certificate }
