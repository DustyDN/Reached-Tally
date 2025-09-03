export async function handler(event) {
  const UPSTASH_URL = process.env.UPSTASH_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return { statusCode: 500, body: "Missing Redis credentials" };
  }

  // Handle GET request → return current counter
  if (event.httpMethod === "GET") {
    const res = await fetch(`${UPSTASH_URL}/get/counter`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    const value = await res.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ value: value.result || 0 })
    };
  }

  // Handle POST request → update counter
  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body || "{}");
    const change = body.change || 0;

    const res = await fetch(`${UPSTASH_URL}/incrby/counter/${change}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    const value = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ value: value.result })
    };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
}
