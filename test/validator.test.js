const { Certificate, Service, Validator } = require('../src');

jest.setTimeout(10000);

describe('Testing Validator', () => {

  test('get certificate from image', async () => {
    const dcc = await Certificate.fromImage('./test/data/example_qr_vaccine_recovery.png');
    const validation = Validator.checkRules(dcc);
  });

  test('get certificate from raw', async () => {
    const dcc = await Certificate.fromImage('./test/data/example_qr_vaccine_recovery.png');
    const validation = Validator.checkRules(dcc);
  });
});
