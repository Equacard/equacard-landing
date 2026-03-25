/* netlify/functions/counter-increment.js */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'counts.json');
const TMP_PATH = path.join(__dirname, '..', '..', 'counts.tmp.json');

async function readCount() {
  try {
    const raw = await fs.promises.readFile(DB_PATH, 'utf8');
    const obj = JSON.parse(raw);
    return Number(obj.count || 0);
  } catch (e) {
    return 0;
  }
}

async function writeCount(count) {
  const payload = JSON.stringify({ count });
  await fs.promises.writeFile(TMP_PATH, payload, 'utf8');
  await fs.promises.rename(TMP_PATH, DB_PATH);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SECRET = process.env.COUNTER_SECRET;
  const incoming = (event.headers && (event.headers['x-secret'] || event.headers['X-Secret'] || event.headers['x-SECRET'])) || '';
  if (SECRET && incoming !== SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  let body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch(e){ body = {}; }
  const inc = Math.max(1, Number(body.inc) || 1);

  const current = await readCount();
  const next = current + inc;
  try {
    await writeCount(next);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: next })
    };
  } catch (err) {
    console.error('write error', err);
    return { statusCode: 500, body: 'Write error' };
  }
};