export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://one-power-fitness.webflow.io"
  );

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  let payload = req.body || {};

  if (!payload.contract || !payload.customer) {
    return res.status(400).json({
      errorCodes: ["BAD_REQUEST"],
      message: "Objek 'contract' dan 'customer' wajib dikirimkan.",
    });
  }

  try {
    console.log(
      `[API Proxy] Membuat kontrak baru (Studio: ${
        payload.studioId || "Default"
      })`
    );

    const url =
      "https://one-power-fitness-abensberg.api.sandbox.magicline.com/connect/v1/rate-bundle";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: responseText };
      }
    }

    if (!response.ok) {
      console.error(`[API Proxy] Magicline Error (${response.status}):`, data);
      return res.status(response.status).json({
        errorCodes: data.errorCodes || ["SERVER_ERROR"],
        message: data.message || "Terjadi kesalahan dari API Magicline",
        traceId: data.traceId,
      });
    }

    console.log(`[API Proxy] Kontrak berhasil dibuat!`);
    return res.status(200).json(data);
  } catch (error) {
    console.error("[API Proxy] Server connection failed:", error);
    return res.status(500).json({
      errorCodes: ["SERVER_ERROR"],
      message: "Internal server error",
    });
  }
}
