// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//       console.warn(`[Webhook] Invalid method used: ${req.method}`);
//       return res.status(405).json({ error: "Method Not Allowed" });
//     }

//     // Validasi keamanan API Key dari Magicline
//     const apiKey = req.headers["x-api-key"];
//     if (apiKey !== process.env.MAGICLINE_WEBHOOK_SECRET) {
//       console.error("[Webhook] Unauthorized access attempt: Invalid API Key");
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     try {
//       const data = req.body;

//       // 1. Ekstrak data utama sesuai skema
//       const entityId = data.entityId;
//       const eventUuid = data.uuid;

//       // 2. Ekstrak payload (skema menyebutkan ini array, kita ambil elemen pertama)
//       const eventPayload = data.payload?.[0] || {};
//       const eventType = eventPayload.type;
//       const eventTimestamp = eventPayload.timestamp;
//       const eventContent = eventPayload.content || {}; // Opsional / Placeholder dari Magicline

//       const readableDate = new Date(eventTimestamp).toISOString();

//       console.log(`[Webhook] --- New Event Received ---`);
//       console.log(`[Webhook] Event Type : ${eventType}`);
//       console.log(`[Webhook] Entity ID  : ${entityId}`);
//       console.log(`[Webhook] Event UUID : ${eventUuid}`);
//       console.log(`[Webhook] Timestamp  : ${readableDate}`);

//       if (Object.keys(eventContent).length > 0) {
//         console.log(`[Webhook] Content    :`, eventContent);
//       }

//       // 4. Syarat mutlak Magicline: Kembalikan respons 200 OK di bawah 5 detik
//       res
//         .status(200)
//         .json({ success: true, message: "Webhook received successfully" });

//       // =========================================================================
//       // PERHATIAN: Di sinilah Anda memicu proses asinkron untuk Webflow
//       // Misalnya, menggunakan entityId ini untuk memanggil fungsi get-customer
//       // lalu mengirimkan datanya ke CMS Webflow, dsb.
//       // =========================================================================
//     } catch (error) {
//       console.error("[Webhook] Error processing webhook payload:", error);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
