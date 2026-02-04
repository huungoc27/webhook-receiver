# Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐        ┌─────────────────────────────┐   │
│  │              │        │   Serverless Functions      │   │
│  │   Vue.js     │◄──────►│   (Node.js API Routes)      │   │
│  │   Frontend   │        │                             │   │
│  │   (Static)   │        │  • /api/login               │   │
│  │              │        │  • /api/register            │   │
│  └──────────────┘        │  • /api/endpoints           │   │
│                          │  • /api/webhook/[...path]   │   │
│                          │  • /api/logs                │   │
│                          └────────┬────────────────────┘   │
│                                   │                        │
│                          ┌────────▼────────┐               │
│                          │                 │               │
│                          │  Vercel         │               │
│                          │  Postgres       │               │
│                          │                 │               │
│                          │  • users        │               │
│                          │  • endpoints    │               │
│                          │  • webhook_logs │               │
│                          └─────────────────┘               │
│                                   │                        │
│                          ┌────────▼────────┐               │
│                          │                 │               │
│                          │  Vercel KV      │               │
│                          │  (Redis)        │               │
│                          │                 │               │
│                          │  Full webhook   │               │
│                          │  request data   │               │
│                          └─────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │
                   ┌───────────┴───────────┐
                   │                       │
              ┌────▼────┐             ┌───▼────┐
              │         │             │        │
              │  LINE   │             │  User  │
              │ Message │             │ Browser│
              │   API   │             │        │
              │         │             │        │
              └─────────┘             └────────┘
```

## Data Flow

### 1. User Authentication Flow

```
User Browser → POST /api/login
              ↓
       Verify credentials (Postgres)
              ↓
       Generate JWT token
              ↓
       Set httpOnly cookie
              ↓
       Return user data
```

### 2. Create Webhook Endpoint Flow

```
User Dashboard → POST /api/endpoints
                ↓
         Verify authentication (JWT)
                ↓
         Generate unique path (nanoid)
                ↓
         Store in Postgres
                ↓
         Return endpoint details
```

### 3. Receive Webhook Flow

```
LINE Server → POST /api/webhook/{path}
             ↓
      Find endpoint by path (Postgres)
             ↓
      Verify LINE signature (HMAC-SHA256)
             ↓
      ┌──────┴──────┐
      ↓             ↓
  Store in KV   Store log ref in Postgres
  (full data)   (metadata only)
      ↓             ↓
      └──────┬──────┘
             ↓
      Return 200 OK
```

### 4. View Logs Flow

```
User Dashboard → GET /api/logs?endpointId=X
                ↓
         Verify ownership (Postgres)
                ↓
         Get log references (Postgres)
                ↓
         Fetch full data from KV
                ↓
         Return combined data
```

## Component Details

### Frontend (Vue.js)

**Pages:**
- `Login.vue` - Authentication
- `Dashboard.vue` - Main interface

**Key Features:**
- Vue Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Session persistence via cookies

### Backend (Serverless Functions)

**API Routes:**

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/login` | POST | No | User login |
| `/api/register` | POST | No | User registration |
| `/api/logout` | POST | No | User logout |
| `/api/endpoints` | GET | Yes | List endpoints |
| `/api/endpoints` | POST | Yes | Create endpoint |
| `/api/endpoints` | DELETE | Yes | Delete endpoint |
| `/api/webhook/[...path]` | ALL | No* | Receive webhooks |
| `/api/logs` | GET | Yes | Get webhook logs |

*Authenticated via LINE signature verification

### Database Schema

**Postgres Tables:**

1. **users** - User accounts
   - Stores hashed passwords
   - Referenced by endpoints

2. **webhook_endpoints** - Webhook URLs
   - Unique paths
   - LINE Channel Secret for verification
   - User ownership

3. **webhook_logs** - Log metadata
   - References to KV data
   - Timestamps
   - Quick queries

**KV (Redis) Storage:**
- Full webhook request data
- 7-day TTL
- Key format: `webhook:{endpointId}:{randomId}`

## Security Architecture

### Authentication Layer

```
Request → Cookie Parser → JWT Verify → User Context
                              ↓
                          [Valid?]
                          ↓     ↓
                        Yes    No (401)
                         ↓
                    Process Request
```

### Webhook Verification

```
Incoming Webhook → Extract LINE Signature
                   ↓
              Get Channel Secret
                   ↓
         Compute HMAC-SHA256(secret, body)
                   ↓
              Compare Signatures
              ↓          ↓
           Match      Mismatch
             ↓           ↓
         Accept      Reject (401)
```

## Performance Considerations

### Serverless Cold Starts
- First request may take 1-2s
- Subsequent requests: <100ms
- Vercel Edge functions for critical paths

### Database Queries
- Indexed on user_id, path, endpoint_id
- Connection pooling via Vercel
- Prepared statements prevent SQL injection

### Caching Strategy
- Static frontend cached at CDN edge
- KV (Redis) for fast webhook data retrieval
- 7-day retention to manage storage costs

## Scalability

### Current Limits (Free Tier)
- **Requests**: 100k/month serverless invocations
- **Database**: 256MB Postgres, 10k rows
- **KV**: 256MB, 100k requests/day
- **Bandwidth**: 100GB/month

### Scaling Path
1. Upgrade Vercel plan ($20/mo → unlimited requests)
2. Upgrade Postgres storage ($20/mo → 512MB)
3. Add Redis cache for frequently accessed data
4. Implement webhook batching for high-volume endpoints

## Deployment Architecture

### Production Setup

```
GitHub Repository
      ↓
   [Push commit]
      ↓
Vercel Auto-Deploy
      ↓
   Build Process
   • npm install
   • npm run build
   • Deploy static files to CDN
   • Deploy functions to edge
      ↓
   [Deployment Complete]
      ↓
   HTTPS Endpoint Live
```

### Environment Separation

- **Production**: Main branch → vercel.app domain
- **Preview**: Feature branches → preview-*.vercel.app
- **Development**: Local → localhost:5173

## Monitoring & Observability

### Built-in Vercel Tools
- Real-time function logs
- Performance analytics
- Error tracking
- Resource usage metrics

### Recommended External Tools
- **Sentry**: Error tracking
- **Uptime Robot**: Availability monitoring
- **Better Stack**: Log aggregation

## Cost Optimization

### Current Setup (Free)
- Serverless functions: Free tier sufficient for most use
- Postgres: Free 256MB (hundreds of thousands of webhooks)
- KV: Free 256MB (7-day retention helps)

### When to Upgrade
- 100k+ serverless invocations/month
- Database > 200MB
- Need longer webhook retention
- Multiple team members

## Future Architecture Improvements

1. **Edge Caching**: Cache endpoint lookups at edge
2. **Webhook Forwarding**: Real-time relay to other services
3. **Batch Processing**: Queue webhooks for batch analysis
4. **Multi-Region**: Deploy to multiple Vercel regions
5. **WebSocket Updates**: Real-time dashboard updates
