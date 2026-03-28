// netlify/functions/counter.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function extractCountFromRow(row) {
  if (!row) return 0;
  if (typeof row.value === 'number') return row.value;
  if (typeof row.count === 'number') return row.count;
  // cerca la prima proprietà numerica
  for (const k of Object.keys(row)) {
    if (typeof row[k] === 'number') return row[k];
  }
  return 0;
}

exports.handler = async function (event, context) {
  try {
    console.log('counter invoked, SUPABASE_URL present:', !!process.env.SUPABASE_URL);

    // Prima prova: colonne comuni
    let res = await supabase.from('counters').select('value,count').eq('id', 'main').single();

    if (res.error) {
      // Se la prima query fallisce, prova a leggere tutto il record
      console.warn('First select failed, trying select *', res.error.message || res.error);
      res = await supabase.from('counters').select('*').eq('id', 'main').single();
    }

    if (res.error) {
      console.error('Supabase read error object:', res.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'supabase_read_error', details: res.error.message || res.error }),
      };
    }

    console.log('Supabase read data:', res.data);
    const count = extractCountFromRow(res.data);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    };
  } catch (err) {
    console.error('counter read exception:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'internal server error', details: String(err) }),
    };
  }
};