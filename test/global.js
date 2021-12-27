const { Service } = require('../src');

beforeEach(async () => {
  await Service.setUp();
  await Service.cleanCRL();
});

afterEach(async () => {
  await Service.tearDown();
});
