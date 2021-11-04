const {Certificate, Service, Validator} = require('./src');


const main = async () => {
  // await Service.updateRules();
  // await Service.updateSignaturesList();
  // await Service.updateSignatures();
  // const dccH = await Certificate.fromImage('./test/data/shit.png');
  // console.log(Validator.checkRules(dccH))
  // console.log(await Validator.checkSignature(dccH))
  // const dccU = await Certificate.fromImage('./test/data/2.png');
  // console.log(Validator.checkRules(dccU))
  // console.log(await Validator.checkSignature(dccU))

  const dccU = await Certificate.fromImage('./test/data/invalid.png');
  console.log(Validator.checkRules(dccU))
  console.log(await Validator.checkSignature(dccU))
  console.log(dccU)
}

main();
