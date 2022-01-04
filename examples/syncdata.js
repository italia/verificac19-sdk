const { Service } = require('../src');

const main = async () => {
  await Service.updateAll();
};

main();

// Alternatively you can use
// await setUp();
// await updateRules();
// await updateSignaturesList();
// await updateSignatures();
// await updateCRL();
// await tearDown();
