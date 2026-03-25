// netlify/functions/counter.js
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'counts.json');

async function readCount() {
  try {
    const raw = await fs.promises.readFile(DB_PATH, 'utf8');
    const obj = JSON.parse(raw);
    return Number(obj.count || 0);
  } catch (e) {
    return 0;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const count = await readCount();
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count })
  };
};
