const fs = require('fs');

const fixFiles = [
  { path: 'app/api/export/approved/[token]/route.ts', from: 'inv.date', to: 'inv.issueDate' },
  { path: 'app/api/sales/[id]/pdf/route.ts', from: 'invoice.date', to: 'invoice.issueDate' },
  { path: 'lib/integrations/daraz/mapper.ts', from: 'date: order.createdAt', to: 'issueDate: order.createdAt' },
  { path: 'lib/integrations/shopify/mapper.ts', from: 'date: order.createdAt', to: 'issueDate: order.createdAt' },
  { path: 'lib/integrations/woocommerce/mapper.ts', from: 'date: order.date_created', to: 'issueDate: order.date_created' },
  { path: 'modules/assistant/service.ts', from: 'invoice.date.toISOString()', to: 'invoice.issueDate.toISOString()', replaceAll: true },
  { path: 'modules/imports/service.ts', from: 'date: new Date', to: 'issueDate: new Date' }
];

for (const fix of fixFiles) {
  try {
    const fullPath = fix.path;
    let content = fs.readFileSync(fullPath, 'utf8');
    if (fix.replaceAll) {
      content = content.split(fix.from).join(fix.to);
    } else {
      content = content.replace(fix.from, fix.to);
    }
    fs.writeFileSync(fullPath, content);
    console.log('Fixed', fix.path);
  } catch (err) {
    console.error('Failed', fix.path, err.message);
  }
}
