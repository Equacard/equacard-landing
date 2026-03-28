// netlify/functions/counter.js (temporaneo: logging esteso)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async function (event, context) {
  try {
    console.log('counter invoked, env SUPABASE_URL present:', !!process.env.SUPABASE_URL);
    const { data, error } = await supabase
      .from('counters')      // verifica il nome reale della tabella
      .select('value')       // verifica il nome reale della colonna
      .eq('id', 'main')
      .single();

    if (error) {
      console.error('Supabase read error object:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'supabase_read_error', details: error.message || error }),
      };
    }

    console.log('Supabase read data:', data);
    const count = (data && (data.value ?? data.count ?? 0)) || 0;

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