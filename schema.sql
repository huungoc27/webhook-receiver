-- Create tables for webhook receiver app
-- Run this in Vercel Postgres or Supabase

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook endpoints created by users
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    path VARCHAR(255) UNIQUE NOT NULL,
    line_channel_secret VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook request logs (for quick queries, detailed logs in Vercel KV)
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    endpoint_id INT REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    log_key VARCHAR(100) NOT NULL, -- Key to fetch from Vercel KV
    method VARCHAR(10),
    received_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_endpoint_id (endpoint_id),
    INDEX idx_received_at (received_at)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user_id ON webhook_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_path ON webhook_endpoints(path);
