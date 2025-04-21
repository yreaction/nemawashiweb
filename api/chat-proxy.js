// Vercel Serverless Function: /api/chat-proxy.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const { message, userId } = req.body || {};
    if (!message || !userId) {
      res.status(400).json({ error: 'Missing message or userId' });
      return;
    }
    // Forward to the real webhook
    const webhookRes = await fetch('https://n8n.nemawashi.ai/webhook-test/ead68b2e-85a0-4239-bfe1-76f233f4eca4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId }),
    });
    const text = await webhookRes.text();
    // Devuelve SIEMPRE el texto crudo recibido del webhook para depuración
    res.status(200).json({ raw: text });
  } catch (e) {
    res.status(500).json({ error: 'Proxy error', details: e.message });
  }
}
