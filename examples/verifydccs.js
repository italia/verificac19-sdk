const { Certificate, Validator } = require('../src');

const main = async () => {
  try {
    const dccTest = await Certificate.fromImage('./test/data/2.png');
    const validationResult = await Validator.validate(dccTest);
    console.log(`Is this DCC valid? ${validationResult.result}`);
    console.log('Details:');
    console.log(validationResult);
    console.log(validationResult.code === Validator.codes.NOT_VALID);
  } catch (error) {
    console.log(error);
  }

  try {
    await Certificate.fromImage('./test/data/invalid.png'); // Throws an exception
  } catch (error) {
    console.log(error);
  }
};

main();
