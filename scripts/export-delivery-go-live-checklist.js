const fs = require('node:fs');
const path = require('node:path');

const {
  buildDeliveryGoLiveChecklist,
  renderDeliveryGoLiveChecklist,
  resolveDeliveryGoLiveOutputPath,
} = require('../lib/delivery-go-live-checklist');

const outputPath = resolveDeliveryGoLiveOutputPath(
  process.env.DELIVERY_GO_LIVE_OUTPUT_PATH ||
    'docs/delivery-go-live-checklist.md',
);

const checklist = buildDeliveryGoLiveChecklist();
const markdown = renderDeliveryGoLiveChecklist(checklist);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown);

console.log('Saulo Fitness APP · Delivery go-live checklist exported');
console.log(`- Output: ${outputPath}`);
console.log(
  '- Use this file as the operational checklist before enabling the Supabase delivery endpoint.',
);
