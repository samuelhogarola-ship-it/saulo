const fs = require('node:fs');

const {
  buildDeliveryContract,
  resolveHandoffOutputPath,
} = require('../lib/magic-link-provider-contract');

const outputPath = resolveHandoffOutputPath(
  process.env.DELIVERY_HANDOFF_OUTPUT_PATH ||
    'docs/provider-magic-link-handoff.md',
);

const contract = buildDeliveryContract();

const markdown = buildMarkdown(contract);

fs.mkdirSync(require('node:path').dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown);

console.log('Saulo Fitness APP · Supabase delivery handoff exported');
console.log(`- Output: ${outputPath}`);
console.log(
  '- Use this file to wire the delivery webhook into a Supabase Edge Function.',
);

function buildMarkdown(contract) {
  return `# Saulo Fitness APP · Supabase Magic Link Delivery Handoff

## Summary

- Webhook URL: \`${contract.webhookUrl}\`
- Sender name: \`${contract.senderName}\`
- Signature header: \`${contract.signatureHeader}\`
- Bearer auth: ${contract.hasBearer ? 'configured' : 'disabled'}
- HMAC signature: ${contract.hasSignature ? 'configured' : 'disabled'}

## Delivery purpose

A Supabase Edge Function will receive a JSON POST whenever a trainer marks payment as received and the app prepares a unique waiting-room link for the student.

## HTTP request

- Method: \`POST\`
- Path: \`/webhook/magic-link\`

## Headers

\`\`\`json
${JSON.stringify(contract.headers, null, 2)}
\`\`\`

## Payload example

\`\`\`json
${contract.prettyPayload}
\`\`\`

## Expected 2xx response

When the Supabase delivery endpoint accepts the delivery, it should return a \`2xx\` response and, if possible, include the confirmed channel and its own delivery identifier so the trainer panel can persist the real state.

\`\`\`json
${JSON.stringify(contract.responseExample, null, 2)}
\`\`\`

## Manual cURL test

\`\`\`bash
${contract.curl}
\`\`\`

## Expected behavior

- Accept the POST request and return a \`2xx\` response when delivery is accepted.
- If possible, return \`channel\` with the real delivery channel used, for example \`email\` or \`whatsapp\`.
- If possible, return \`deliveryId\` with the Supabase-side or downstream delivery identifier for traceability.
- Use the \`message\`, \`mailtoUrl\`, \`whatsappUrl\`, and \`access.waitingRoomUrl\` fields to deliver the student access.
- Do not expose the final \`/app/\` access flow directly to the student outside the waiting-room link.
`;
}
