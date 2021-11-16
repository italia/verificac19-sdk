const { Service } = require('../src');

const main = async () => {
  await Service.checkCRL();
  await Service.updateCRL();
};

main();
