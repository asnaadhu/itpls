const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return onRequestOptions();
  }
  return onRequestPost(context);
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    if (request.method === "OPTIONS") {
      return onRequestOptions();
    }

    const body = await request.json().catch(() => ({}));
    const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY environment variable is not configured in Cloudflare Pages settings.",
        }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const cleanBase64 = (body.imageBase64 || "").replace(/^data:image\/\w+;base64,/, "");
    const mimeType = body.mimeType || "image/jpeg";

    const promptText = `Analyze this financial statement / expense report screenshot.
Extract:
1. The month name shown in the table header or title (e.g. "July", "January", "August", etc.). If not found, return an empty string.
2. Every line item in the table along with its numerical values for Actual, Budget, and Last Year.
Note:
- Ignore all percentage columns (columns with '%' header).
- Clean formatted numbers like "23,091" or "$1,151" to integer numbers (e.g. 23091, 1151).
- If a value is 0, blank, or missing, set it to 0.
- Extract individual expense line items accurately (e.g., Salaries & Wages, Cost of Cell Phones, Dues and Subscriptions, etc.).

Return strictly valid JSON with format:
{
  "monthName": "Month string or empty",
  "items": [
    {
      "lineItemName": "Line item title",
      "actual": 0,
      "budget": 0,
      "lastYear": 0
    }
  ]
}`;

    // Models supported on Gemini v1beta REST API with fallback order
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest", "gemini-3.6-flash", "gemini-2.5-pro"];
    let geminiResponse = null;
    let lastErrorMsg = "";

    for (const model of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { inline_data: { mime_type: mimeType, data: cleanBase64 } },
                    { text: promptText },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: "application/json",
              },
            }),
          });

          if (res.ok) {
            geminiResponse = await res.json();
            break;
          } else {
            const errData = await res.json().catch(() => ({}));
            lastErrorMsg = errData?.error?.message || `HTTP ${res.status}`;
            if ((res.status === 503 || res.status === 429 || lastErrorMsg.includes("UNAVAILABLE")) && attempt === 0) {
              await new Promise((r) => setTimeout(r, 800));
              continue;
            }
            break;
          }
        } catch (err) {
          lastErrorMsg = err.message;
          break;
        }
      }
      if (geminiResponse) {
        break;
      }
    }

    if (!geminiResponse) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Gemini API call failed on Cloudflare: ${lastErrorMsg}`,
        }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const rawText =
      geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    let parsedData = { monthName: "", items: [] };
    try {
      parsedData = JSON.parse(rawText);
    } catch (_e) {
      console.warn("Could not parse JSON from Gemini REST response:", rawText);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedData,
      }),
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
