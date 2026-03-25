// test-counter.js
const handler = require('./netlify/functions/counter').handler;

(async () => {
  const res = await handler({});
  console.log('status', res.statusCode);
  console.log('body', res.body);
})();
