// netlify/functions/counter.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function extractCountFromRow(row) {
  if (!row) return 0;
  if (typeof row.value === 'number') return row.value;
  if (typeof row.count === 'number') return row.count;
  for (const k of Object.keys(row)) {
    if (typeof row[k] === 'number') return row[k];
  }
  return 0;
}

exports.handler = async function (event, context) {
  try {
    // Prova colonne comuni, poi fallback a select *
    let res = await supabase.from('counters').select('value,count').eq('id', 'main').single();

    if (res.error) {
      res = await supabase.from('counters').select('*').eq('id', 'main').single();
    }

    if (res.error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'supabase_read_error', details: res.error.message || res.error }),
      };
    }

    const count = extractCountFromRow(res.data);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'internal server error', details: String(err) }),
    };
  }
};