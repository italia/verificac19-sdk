const { Certificate, Validator } = require('../src');

const main = async () => {
  try {
    const dccTest = await Certificate.fromImage('./test/data/2.png');
    console.log(Validator.checkRules(dccTest));
    console.log(await Validator.checkSignature(dccTest));
    const dccInvalid = await Certificate.fromImage('./test/data/invalid.png');
    console.log(Validator.checkRules(dccInvalid));
    console.log(await Validator.checkSignature(dccInvalid));
  } catch (error) {
    console.log(error);
  }
};

main();
