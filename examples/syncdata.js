const { Service } = require('../src');

const main = async () => {
  await Service.updateAll();
};

main();

// Alternatively you can use
// await Service.updateRules();
// await Service.updateSignaturesList();
// await Service.updateSignatures();
