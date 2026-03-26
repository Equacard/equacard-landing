exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      SUPABASE_URL: process.env.SUPABASE_URL ? "OK" : "MISSING",
      SUPABASE_KEY: process.env.SUPABASE_KEY ? "OK" : "MISSING"
    })
  };
};
