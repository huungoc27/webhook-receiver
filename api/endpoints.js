import { db } from './_utils/db.js';
import { authenticate } from './_utils/middleware.js';
import { nanoid } from 'nanoid';

async function handleGet(req, res) {
  const endpoints = await db.getEndpointsByUserId(req.user.id);
  return res.status(200).json({ endpoints });
}

async function handlePost(req, res) {
  const { lineChannelSecret, description } = req.body;

  if (!lineChannelSecret) {
    return res.status(400).json({ error: 'LINE Channel Secret required' });
  }

  // Generate unique path
  const path = nanoid(10);

  try {
    const endpoint = await db.createEndpoint(
      req.user.id,
      path,
      lineChannelSecret,
      description || ''
    );

    return res.status(201).json({ endpoint });
  } catch (error) {
    console.error('Create endpoint error:', error);
    return res.status(500).json({ error: 'Failed to create endpoint' });
  }
}

async function handleDelete(req, res) {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Endpoint ID required' });
  }

  try {
    await db.deleteEndpoint(id, req.user.id);
    return res.status(200).json({ message: 'Endpoint deleted' });
  } catch (error) {
    console.error('Delete endpoint error:', error);
    return res.status(500).json({ error: 'Failed to delete endpoint' });
  }
}

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default authenticate(handler);
