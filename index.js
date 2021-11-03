const {Certificate, Service, Validator} = require('./src');


const main = async () => {
  // await Service.updateRules();
  // await Service.updateSignaturesList();
  // await Service.updateSignatures();
  const dcc = await Certificate.fromImage('./test/data/example_qr_vaccine_recovery.png');
  console.log(Validator.checkRules(dcc))
}

main();
