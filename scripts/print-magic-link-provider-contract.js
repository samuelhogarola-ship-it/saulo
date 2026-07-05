const {
  buildDeliveryContract,
} = require('../lib/magic-link-provider-contract');

const contract = buildDeliveryContract();

console.log('Saulo Fitness APP · Supabase delivery contract');
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
console.log('\nExpected endpoint 2xx response');
console.log(JSON.stringify(contract.responseExample, null, 2));
console.log('\nManual test cURL');
console.log(contract.curl);
console.log('\nCopy for Supabase function');
console.log(
  'Usa este contrato en tu Edge Function de Supabase para recibir el POST JSON, procesar la entrega y devolver una respuesta 2xx con channel y deliveryId cuando confirme el envio.',
);
