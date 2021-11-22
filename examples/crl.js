const { Service } = require('../src');
const cache = require('../src/cache');

const main = async () => {
  await Service.setUp();
  // await Service.cleanCRL();
  // console.log('Version 0, 1 and 2');
  // await Service.updateCRL();
  console.log(await cache.isUVCIRevoked('LJQUFoUUokc5sdVdj/zGq47cz4Up/dihCPOsPsOBXZ8='));
  await Service.tearDown();
};

main();
