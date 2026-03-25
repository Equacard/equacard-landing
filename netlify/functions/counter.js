const fs = require('fs').promises;
const path = require('path');

const TMP_PATH = '/tmp/counts.json';

async function readCount() {
  try {
    const raw = await fs.readFile(TMP_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    try {
      const raw2 = await fs.readFile(path.join(__dirname, '..', '..', 'counts.json'), 'utf8');
      return JSON.parse(raw2);
    } catch (err2) {
      return { count: 0 };
    }
  }
}

exports.handler = async function() {
  try {
    const data = await readCount();
    return { statusCode: 200, body: JSON.stringify({ count: data.count || 0 }) };
  } catch (err) {
    console.error('counter read error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'internal server error' }) };
  }
};
