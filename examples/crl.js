const { Service } = require('../src');

const main = async () => {
  await Service.setUp();
  console.log('Version 0');
  await Service.updateCRL();
  console.log('Version 1');
  await Service.updateCRL();
  console.log('Version 2');
  await Service.updateCRL();
  await Service.tearDown();
};

main();
