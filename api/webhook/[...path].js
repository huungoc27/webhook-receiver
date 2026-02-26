import { db } from '../_utils/db.js';
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
  console.log('=== Webhook Request ===');
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);
  
  // Vercel passes the catch-all param as '...path' (literal dots in key name)
  const path = req.query['...path'] || req.query.path;

  if (!path || (Array.isArray(path) && path.length === 0)) {
    console.error('No path in query');
    return res.status(404).json({ error: 'Webhook path not found' });
  }

  const webhookPath = Array.isArray(path) ? path.join('/') : path;
  console.log('Looking for webhook path:', webhookPath);

  try {
    // Find endpoint
    console.log('Querying database for path:', webhookPath);
    const endpoint = await db.getEndpointByPath(webhookPath);
    console.log('Database result:', endpoint);

    if (!endpoint) {
      console.error('Endpoint not found for path:', webhookPath);
      return res.status(404).json({ 
        error: 'Webhook endpoint not found',
        path: webhookPath,
        debug: 'Check if path exists in webhook_endpoints table'
      });
    }

    console.log('Found endpoint:', endpoint.id);

    // Get LINE signature
    const signature = req.headers['x-line-signature'];
    
    if (!signature) {
      console.error('Missing LINE signature header');
      return res.status(400).json({ error: 'Missing LINE signature' });
    }

    // Get raw body as string for signature verification
    const bodyString = JSON.stringify(req.body);
    console.log('Body for signature:', bodyString);
    
    // Verify LINE signature
    const isValid = verifyLineSignature(
      endpoint.line_channel_secret,
      signature,
      bodyString
    );

    if (!isValid) {
      console.error('Invalid signature. Expected vs received:', {
        body: bodyString,
        signature: signature
      });
      return res.status(401).json({ error: 'Invalid LINE signature' });
    }

    console.log('Signature verified successfully');

    // Handle LINE webhook verification (empty events array)
    if (req.body && req.body.events && req.body.events.length === 0) {
      console.log('LINE verification request received for:', webhookPath);
      return res.status(200).json({ message: 'Verification successful' });
    }

    // Store webhook data directly in Postgres (payload column)
    const webhookData = {
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString()
    };

    await db.saveWebhookLog(endpoint.id, req.method, webhookData);

    console.log('Webhook saved successfully');
    return res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error details:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: true
  }
};