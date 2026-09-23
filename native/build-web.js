// Bundle the customer app (+ shared code & assets) into www/ for the native iOS shell.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(__dirname, 'www');
fs.rmSync(out, { recursive: true, force: true });
for (const d of ['customer', 'shared', 'assets']) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>html,body{margin:0;background:#F4F7F5}</style><script>location.replace("customer/index.html")</script>');
console.log('www ready');
