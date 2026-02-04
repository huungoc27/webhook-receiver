import { sql } from '@vercel/postgres';
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const db = {
  // User functions
  async createUser(username, password) {
    const hash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${hash})
      RETURNING id, username, created_at
    `;
    return result.rows[0];
  },

  async findUserByUsername(username) {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username}
    `;
    return result.rows[0];
  },

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  // Webhook endpoint functions
  async createEndpoint(userId, path, lineChannelSecret, description = '') {
    const result = await sql`
      INSERT INTO webhook_endpoints (user_id, path, line_channel_secret, description)
      VALUES (${userId}, ${path}, ${lineChannelSecret}, ${description})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getEndpointsByUserId(userId) {
    const result = await sql`
      SELECT * FROM webhook_endpoints
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return result.rows;
  },

  async getEndpointByPath(path) {
    const result = await sql`
      SELECT * FROM webhook_endpoints
      WHERE path = ${path} AND is_active = true
    `;
    return result.rows[0];
  },

  async deleteEndpoint(id, userId) {
    await sql`
      DELETE FROM webhook_endpoints
      WHERE id = ${id} AND user_id = ${userId}
    `;
  },

  // Webhook log functions
  async saveWebhookLog(endpointId, method, logKey) {
    const result = await sql`
      INSERT INTO webhook_logs (endpoint_id, method, log_key)
      VALUES (${endpointId}, ${method}, ${logKey})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getWebhookLogs(endpointId, limit = 50) {
    const result = await sql`
      SELECT * FROM webhook_logs
      WHERE endpoint_id = ${endpointId}
      ORDER BY received_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  }
};

export const cache = {
  async saveWebhookData(key, data) {
    if (!redis) throw new Error('Redis not configured');
    await redis.set(key, JSON.stringify(data), 'EX', 60 * 60 * 24 * 7); // 7 days
  },

  async getWebhookData(key) {
    if (!redis) throw new Error('Redis not configured');
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
};

export const auth = {
  generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
};
