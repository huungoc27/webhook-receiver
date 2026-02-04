import { db, cache } from './_utils/db.js';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

// Verify LINE signature
function verifyLineSignature(channelSecret, signature, body) {
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');
  return signature === hash;
}

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path || path.length === 0) {
    return res.status(404).json({ error: 'Webhook path not found' });
  }

  const webhookPath = Array.isArray(path) ? path.join('/') : path;

  try {
    // Find endpoint
    const endpoint = await db.getEndpointByPath(webhookPath);

    if (!endpoint) {
      return res.status(404).json({ error: 'Webhook endpoint not found' });
    }

    // Get raw body for signature verification
    const signature = req.headers['x-line-signature'];
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing LINE signature' });
    }

    // For Vercel, we need to reconstruct body as string
    const bodyString = JSON.stringify(req.body);
    
    // Verify LINE signature
    const isValid = verifyLineSignature(
      endpoint.line_channel_secret,
      signature,
      bodyString
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid LINE signature' });
    }

    // Store webhook data
    const logKey = `webhook:${endpoint.id}:${nanoid()}`;
    
    const webhookData = {
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString()
    };

    await cache.saveWebhookData(logKey, webhookData);
    await db.saveWebhookLog(endpoint.id, req.method, logKey);

    return res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: true
  }
};
