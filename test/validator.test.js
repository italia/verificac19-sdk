const { Certificate, Validator } = require('../src');

describe('Testing Validator', () => {
  test('rules verification', async () => {
    const dcc = await Certificate.fromImage('./test/data/shit.png');
    expect(Validator.checkRules(dcc).result).toStrictEqual(false);
  });

  test('signature verification', async () => {
    const dcc = await Certificate.fromImage('./test/data/shit.png');
    const isSignatureValid = await Validator.checkSignature(dcc);
    console.log(isSignatureValid);
    expect(isSignatureValid).toStrictEqual(true);
  });
});
