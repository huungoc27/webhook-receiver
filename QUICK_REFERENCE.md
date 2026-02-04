# Quick Reference Guide

## 🚀 Quick Start Commands

### Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs --follow
```

### Database Commands
```bash
# Create Postgres
vercel postgres create

# Run SQL query
vercel postgres sql -- "SELECT * FROM users;"

# Run schema file
vercel postgres sql -- "$(cat schema.sql)"

# Create KV store
vercel kv create
```

## 📡 API Endpoints Reference

### Authentication
```bash
# Register
POST /api/register
Body: { "username": "user", "password": "pass123" }

# Login
POST /api/login
Body: { "username": "user", "password": "pass123" }

# Logout
POST /api/logout
```

### Webhook Management
```bash
# Get all endpoints
GET /api/endpoints
Headers: Cookie: token=<jwt>

# Create endpoint
POST /api/endpoints
Headers: Cookie: token=<jwt>
Body: {
  "lineChannelSecret": "your-secret",
  "description": "Production Bot"
}

# Delete endpoint
DELETE /api/endpoints
Headers: Cookie: token=<jwt>
Body: { "id": 1 }
```

### Webhook Receiver
```bash
# Receive webhook
POST /api/webhook/{path}
Headers: {
  "x-line-signature": "base64-signature",
  "content-type": "application/json"
}
Body: { "events": [...] }
```

### Logs
```bash
# Get logs for endpoint
GET /api/logs?endpointId=1
Headers: Cookie: token=<jwt>
```

## 🗄️ Database Queries

### Check Users
```sql
SELECT id, username, created_at FROM users;
```

### Check Endpoints
```sql
SELECT 
  e.id,
  e.path,
  e.description,
  u.username,
  e.created_at
FROM webhook_endpoints e
JOIN users u ON e.user_id = u.id;
```

### Check Recent Webhooks
```sql
SELECT 
  wl.id,
  wl.method,
  wl.received_at,
  we.path,
  we.description
FROM webhook_logs wl
JOIN webhook_endpoints we ON wl.endpoint_id = we.id
ORDER BY wl.received_at DESC
LIMIT 10;
```

### Count Webhooks by Endpoint
```sql
SELECT 
  we.description,
  COUNT(wl.id) as webhook_count
FROM webhook_endpoints we
LEFT JOIN webhook_logs wl ON we.id = wl.endpoint_id
GROUP BY we.id, we.description;
```

## 🔐 Environment Variables

### Required
```env
JWT_SECRET=your-secret-key-min-32-chars
```

### Auto-Set by Vercel
```env
# Postgres
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# KV (Redis)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

## 🧪 Testing LINE Webhooks

### Test with cURL
```bash
# Calculate signature
BODY='{"events":[{"type":"message","message":{"type":"text","text":"Hello"}}]}'
SECRET="your-channel-secret"
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)

# Send webhook
curl -X POST https://your-app.vercel.app/api/webhook/your-path \
  -H "Content-Type: application/json" \
  -H "x-line-signature: $SIGNATURE" \
  -d "$BODY"
```

### Test with LINE Console
1. Go to LINE Developers Console
2. Your channel → Messaging API
3. Set webhook URL
4. Click "Verify" button
5. Check logs in your dashboard

## 🛠️ Common Tasks

### Add New User via SQL
```sql
-- Password is hashed, so use the register endpoint instead
-- Or hash manually:
INSERT INTO users (username, password_hash)
VALUES ('admin', '$2a$10$...');  -- Use bcrypt hash
```

### Delete All Logs for Testing
```sql
DELETE FROM webhook_logs;
```

### Clear KV Cache (via API or CLI)
```javascript
// In code
await kv.del('webhook:1:abc123');

// Or use Vercel dashboard → Storage → KV → Data tab
```

### Reset User Password (via SQL)
```javascript
// Generate new hash first
const bcrypt = require('bcryptjs');
const newHash = await bcrypt.hash('newpassword', 10);

// Then update
UPDATE users 
SET password_hash = '$2a$10$...' 
WHERE username = 'user';
```

## 📊 Monitoring Commands

### Check Function Invocations
```bash
vercel logs --follow
```

### Check Database Size
```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as db_size,
  pg_size_pretty(pg_total_relation_size('users')) as users_size,
  pg_size_pretty(pg_total_relation_size('webhook_endpoints')) as endpoints_size,
  pg_size_pretty(pg_total_relation_size('webhook_logs')) as logs_size;
```

### Check Recent Errors (in logs)
```bash
vercel logs --follow | grep ERROR
```

## 🐛 Troubleshooting Commands

### Verify Environment Variables
```bash
# Check locally
cat .env.local

# Check in Vercel
vercel env ls
```

### Test Database Connection
```bash
vercel postgres sql -- "SELECT NOW();"
```

### Test KV Connection
```bash
# Via Vercel CLI (if available)
# Or check in dashboard

# Via code:
import { kv } from '@vercel/kv';
await kv.set('test', 'hello');
await kv.get('test');  // Should return 'hello'
```

### Check Deployment Status
```bash
vercel ls
```

### View Build Logs
```bash
vercel logs <deployment-url>
```

## 📝 File Structure Quick Reference

```
webhook-app/
├── api/                      # Serverless functions
│   ├── _utils/
│   │   ├── db.js            # Database utilities
│   │   └── middleware.js    # Auth middleware
│   ├── login.js             # POST /api/login
│   ├── register.js          # POST /api/register
│   ├── logout.js            # POST /api/logout
│   ├── endpoints.js         # CRUD endpoints
│   ├── logs.js              # GET logs
│   └── webhook/
│       └── [...path].js     # Webhook receiver
├── src/                      # Vue.js frontend
│   ├── views/
│   │   ├── Login.vue
│   │   └── Dashboard.vue
│   ├── utils/
│   │   └── api.js           # API client
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── public/                   # Static assets
├── schema.sql               # Database schema
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

## 🎯 Important URLs

### Development
- Local: http://localhost:5173
- API: http://localhost:3000/api

### Production
- Your app: https://your-app.vercel.app
- Vercel dashboard: https://vercel.com/dashboard
- LINE Console: https://developers.line.biz/console/

## 💡 Pro Tips

1. **Always use HTTPS** in production for webhooks
2. **Rotate JWT_SECRET** regularly for security
3. **Monitor KV usage** - data expires after 7 days
4. **Use environment variables** for all secrets
5. **Test locally** before deploying to production
6. **Keep dependencies updated** for security patches
7. **Set up GitHub Actions** for automated testing (optional)
8. **Use Vercel preview deployments** for testing features

## 🔗 Useful Links

- [Vercel Docs](https://vercel.com/docs)
- [Vue 3 Docs](https://vuejs.org)
- [LINE API Docs](https://developers.line.biz/en/docs/messaging-api/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Need help?** Check the full README.md and DEPLOYMENT.md guides!
