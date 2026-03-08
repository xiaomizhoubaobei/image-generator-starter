export async function onRequest({ request, env }) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; preload',
      },
    });
  }

  // Only allow GET
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; preload',
      },
    });
  }

  const hfTokenPresent = Boolean(env.HF_TOKEN);
  const nebiusTokenPresent = Boolean(env.NEBIUS_TOKEN);
  const replicateTokenPresent = Boolean(env.REPLICATE_TOKEN);
  const openaiTokenPresent = Boolean(env.OPENAI_API_KEY);
  const falTokenPresent = Boolean(env.FAL_KEY);
  const kvStoragePresent = Boolean(env.image_generate_cnt);

  return new Response(
    JSON.stringify({
      hfToken: hfTokenPresent,
      nebiusToken: nebiusTokenPresent,
      replicateToken: replicateTokenPresent,
      openaiToken: openaiTokenPresent,
      falToken: falTokenPresent,
      kvStorage: kvStoragePresent
    }),
    {
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; preload',
      },
    }
  );
} 