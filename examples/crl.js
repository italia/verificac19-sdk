const { Service } = require('../src');
const cache = require('../src/cache');

const main = async () => {
  await Service.setUp();
  await Service.cleanCRL();
  console.log('Version 0, 1 and 2');
  await Service.updateCRL();
  console.log(await cache.isUVCIRevoked('MYF4K3UVC1'));
  await Service.tearDown();
};

main();
