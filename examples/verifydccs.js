const { Certificate, Validator } = require('../src');

const main = async () => {
  try {
    const dccTest = await Certificate.fromImage('./test/data/2.png');
    const validationResult = await Validator.validate(dccTest);
    console.log(`Is this DCC valid? ${validationResult.result}`);
    console.log(validationResult);
    console.log(validationResult.code === Validator.codes.NOT_VALID);
    await Certificate.fromImage('./test/data/invalid.png'); // This throws an exception
  } catch (error) {
    console.log(error);
  }
};

main();
