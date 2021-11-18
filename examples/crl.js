const { Service } = require('../src');
const cache = require('../src/cache');

const main = async () => {
  await Service.setUp();
  console.log('Version 0, 1 and 2');
  await Service.updateCRL();
  console.log(await cache.isUVCIRevoked('asd'));
  await Service.tearDown();
};

main();
