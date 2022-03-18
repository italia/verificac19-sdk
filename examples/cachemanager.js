const { Service, FileCache } = require('../src');

const main = async () => {
  await Service.updateAll(null, new FileCache());
  await Service.tearDown();
};

main();
