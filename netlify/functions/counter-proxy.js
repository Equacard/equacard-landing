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

async function writeCount(data) {
  try {
    await fs.writeFile(TMP_PATH, JSON.stringify(data), 'utf8');
    console.log('writeCount: scritto su', TMP_PATH);
  } catch (err) {
    console.error('write error', err);
    throw err;
  }
}

exports.handler = async function(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const inc = Number(body.inc) || 0;

    const current = await readCount();
    const newCount = (current.count || 0) + inc;

    await writeCount({ count: newCount });

    return {
      statusCode: 200,
      body: JSON.stringify({ count: newCount })
    };
  } catch (err) {
    console.error('counter-proxy error', err && err.stack ? err.stack : err);
    return { statusCode: 500, body: JSON.stringify({ error: 'internal server error' }) };
  }
};