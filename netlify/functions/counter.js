// netlify/functions/counter.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async function (event, context) {
  try {
    // Assumiamo che la tabella si chiami "counters" con colonne { id, value }
    // e che il record usato sia id = 'main'. Se la tua tabella/colonna ha nomi diversi,
    // sostituisci 'counters' e 'value' con i nomi corretti.
    const { data, error } = await supabase
      .from('counters')
      .select('value')
      .eq('id', 'main')
      .single();

    if (error) {
      console.error('Supabase read error', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'internal server error' }),
      };
    }

    const count = (data && (data.value ?? data.count ?? 0)) || 0;

    return {
      statusCode: 200,
      body: JSON.stringify({ count }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (err) {
    console.error('counter read error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'internal server error' }),
    };
  }
};