const { Certificate, Validator } = require('../src');

const main = async () => {
  try {
    const dccTest = await Certificate.fromImage('./test/data/2.png');
    const rulesOk = Validator.checkRules(dccTest);
    const signatureOk = await Validator.checkSignature(dccTest);
    console.log(`Is this DCC valid? ${rulesOk && signatureOk}`);
    console.log(rulesOk);
    await Certificate.fromImage('./test/data/invalid.png'); // This throws an exception
  } catch (error) {
    console.log(error);
  }
};

main();
