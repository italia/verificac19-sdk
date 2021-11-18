const { Service } = require('../src');

beforeEach(async () => {
  await Service.setUp();
});

afterEach(async () => {
  await Service.tearDown();
});
