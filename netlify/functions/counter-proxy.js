// netlify/functions/counter-proxy.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Limiter in-memory temporaneo (non affidabile su più istanze)
const RATE_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_PER_WINDOW = 30;
const ipBuckets = new Map();

function tooManyRequests(ip) {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || { ts: now, count: 0 };
  if (now - bucket.ts > RATE_WINDOW_MS) {
    bucket.ts = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  ipBuckets.set(ip, bucket);
  return bucket.count > MAX_PER_WINDOW;
}

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
    }

    const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['x-nf-client-connection-ip'])) || 'unknown';
    if (tooManyRequests(ip)) {
      return { statusCode: 429, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'rate_limited' }) };
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'invalid_json' }) };
    }

    const inc = Number(body.inc);
    if (!Number.isInteger(inc) || inc === 0) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'invalid inc' }) };
    }

    // Chiamata RPC: increment_counter(p_id, p_inc)
    const { data, error } = await supabase.rpc('increment_counter', { p_id: 'main', p_inc: inc });

    if (error) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'rpc_error', details: error.message || error }) };
    }

    // Estrai valore numerico dalla risposta RPC
    let count = null;
    if (data == null) {
      count = null;
    } else if (typeof data === 'number') {
      count = data;
    } else if (Array.isArray(data) && data.length > 0) {
      const row = data[0];
      count = typeof row.count === 'number' ? row.count : typeof row.value === 'number' ? row.value : null;
    } else if (typeof data === 'object') {
      count = typeof data.count === 'number' ? data.count : typeof data.value === 'number' ? data.value : null;
    }

    if (count === null) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: data }) };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'internal server error', details: String(err) }) };
  }
};