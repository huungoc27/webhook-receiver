import { db, auth } from './_utils/db.js';
import { setCookie } from './_utils/middleware.js';

export default async function handler(req, res) {
  // Add CORS headers for cookies
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await db.findUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await db.verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = auth.generateToken(user);
    setCookie(res, 'token', token);

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}