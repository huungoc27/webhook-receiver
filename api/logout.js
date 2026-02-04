import { setCookie } from './_utils/middleware.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  setCookie(res, 'token', '', { maxAge: 0 });
  return res.status(200).json({ message: 'Logged out' });
}
