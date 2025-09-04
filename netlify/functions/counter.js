export async function handler(event) {
  const UPSTASH_URL = process.env.UPSTASH_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return { statusCode: 500, body: "Missing Redis credentials" };
  }

  const headers = { Authorization: `Bearer ${UPSTASH_TOKEN}` };

  // Helper: get current site data
  async function getSiteData() {
    const res = await fetch(`${UPSTASH_URL}/get/site_data`, { headers });
    const data = await res.json();
    if (!data.result) {
      return { counter: 0, log: [], comments: [] };
    }
    try {
      return JSON.parse(data.result);
    } catch {
      return { counter: 0, log: [], comments: [] };
    }
  }

  // Helper: save site data
  async function saveSiteData(newData) {
    await fetch(`${UPSTASH_URL}/set/site_data/${encodeURIComponent(JSON.stringify(newData))}`, {
      headers
    });
  }

  // Handle GET → return full global state
  if (event.httpMethod === "GET") {
    const siteData = await getSiteData();
    return {
      statusCode: 200,
      body: JSON.stringify(siteData)
    };
  }

  // Handle POST → update state
  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body || "{}");
    const { change, comment } = body;

    let siteData = await getSiteData();

    // Update counter
    if (typeof change === "number") {
      siteData.counter += change;
      siteData.log.push({
        action: change,
        newValue: siteData.counter,
        timestamp: new Date().toISOString()
      });
      if (siteData.log.length > 100) {
        siteData.log = siteData.log.slice(-100);
      }
    }

    // Add comment
    if (comment && comment.trim() !== "") {
      siteData.comments.push({
        text: comment.trim(),
        timestamp: new Date().toISOString()
      });
      if (siteData.comments.length > 25) {
        siteData.comments = siteData.comments.slice(-25);
      }
    }

    // Save global state
    await saveSiteData(siteData);

    return {
      statusCode: 200,
      body: JSON.stringify(siteData)
    };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
}
