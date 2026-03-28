// netlify/functions/counter-proxy.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function safeParseBody(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  let s = String(raw).trim();

  // rimuovi apici singoli esterni: '...'
  if (s.startsWith("'") && s.endsWith("'")) {
    s = s.slice(1, -1);
  }

  // rimuovi apici doppi esterni: "{"inc":1}"
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1);
  }

  // prova a sostituire apici singoli interni con doppi (fallback)
  try {
    return JSON.parse(s);
  } catch (e1) {
    try {
      const replaced = s.replace(/'/g, '"');
      return JSON.parse(replaced);
    } catch (e2) {
      // ultimo fallback: cerca pattern key:value semplice
      return {};
    }
  }
}

exports.handler = async function(event) {
  try {
    console.error('counter-proxy invoked');
    console.error('event.body raw:', event.body);

    const body = safeParseBody(event.body);
    console.error('parsed body:', body);

    const inc = Number(body.inc);
    if (!Number.isInteger(inc) || inc === 0) {
      console.error('invalid inc:', body.inc);
      return { statusCode: 400, body: JSON.stringify({ error: 'invalid inc' }) };
    }

    const { data, error } = await supabase.rpc('increment_counter', { p_id: 'main', p_inc: inc });

    if (error) {
      console.error('supabase rpc error object:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'supabase rpc error', detail: error.message || error }) };
    }

    console.error('supabase rpc data:', data);

    let newCount = null;
    if (Array.isArray(data) && data.length && data[0].count !== undefined) {
      newCount = Number(data[0].count);
    } else if (data && data.count !== undefined) {
      newCount = Number(data.count);
    } else if (Array.isArray(data) && data.length && typeof data[0] === 'number') {
      newCount = Number(data[0]);
    }

    if (newCount === null) {
      console.error('unexpected rpc response shape', data);
      return { statusCode: 500, body: JSON.stringify({ error: 'unexpected rpc response shape', data }) };
    }

    return { statusCode: 200, body: JSON.stringify({ count: newCount }) };
  } catch (err) {
    console.error('counter-proxy caught err:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'internal server error', message: err.message }) };
  }
};