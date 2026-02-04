import { parse } from 'cookie';
import { auth } from './db.js';

export function authenticate(handler) {
  return async (req, res) => {
    try {
      const cookies = parse(req.headers.cookie || '');
      const token = cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = auth.verifyToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = user;
      return handler(req, res);
    } catch (error) {
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

export function setCookie(res, name, value, options = {}) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    ...options
  };

  const cookieParts = [`${name}=${value}`];
  
  if (cookieOptions.httpOnly) cookieParts.push('HttpOnly');
  if (cookieOptions.secure) cookieParts.push('Secure');
  if (cookieOptions.sameSite) cookieParts.push(`SameSite=${cookieOptions.sameSite}`);
  if (cookieOptions.maxAge) cookieParts.push(`Max-Age=${cookieOptions.maxAge}`);
  if (cookieOptions.path) cookieParts.push(`Path=${cookieOptions.path}`);

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}
