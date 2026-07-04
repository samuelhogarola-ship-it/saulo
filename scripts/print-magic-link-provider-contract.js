const {
  buildProviderContract,
} = require('../lib/magic-link-provider-contract');

const contract = buildProviderContract();

console.log('Saulo Fitness APP · Magic link provider contract');
console.log(`- Webhook URL: ${contract.webhookUrl || '(sin configurar)'}`);
console.log(`- Sender name: ${contract.senderName}`);
console.log(`- Signature header: ${contract.signatureHeader}`);
console.log(`- Bearer auth: ${contract.hasBearer ? 'configured' : 'disabled'}`);
console.log(
  `- HMAC signature: ${contract.hasSignature ? 'configured' : 'disabled'}`,
);
console.log('\nHTTP request');
console.log('POST /webhook/magic-link');
console.log('\nHeaders');
console.log(JSON.stringify(contract.headers, null, 2));
console.log('\nPayload');
console.log(contract.prettyPayload);
console.log('\nExpected provider 2xx response');
console.log(JSON.stringify(contract.responseExample, null, 2));
console.log('\nManual test cURL');
console.log(contract.curl);
console.log('\nCopy for provider');
console.log(
  'Entrega este contrato al proveedor final para que espere un POST JSON con estos headers, este cuerpo y devuelva una respuesta 2xx con channel y deliveryId cuando confirme la entrega.',
);
