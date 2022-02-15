const { Service } = require('../src');
const cache = require('../src/cache');
const crlManager = require('./sqlitecrlmanager');

const main = async () => {
  await Service.setUp(crlManager);
  await Service.cleanCRL();
  console.log('Updating CRL...');
  await Service.updateCRL();
  console.log(await cache.isUVCIRevoked('URN:UVCI:01:FR:W7V2BE46QSBJ#L'));
  await Service.tearDown();
};

main();
