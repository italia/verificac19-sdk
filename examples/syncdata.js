const { Service } = require('../src');

const main = async () => {
  await Service.setUp();
  await Service.updateAll();
  await Service.tearDown();
};

main();

// Alternatively you can use
// await Service.setUp();
// await Service.updateRules();
// await Service.updateSignaturesList();
// await Service.updateSignatures();
// await Service.tearDown();
