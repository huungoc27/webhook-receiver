# Webhook Receiver - LINE Message API

A serverless webhook receiver application built with Vue.js and Node.js, deployable on Vercel. Allows users to create webhook endpoints to receive and inspect LINE Message API webhooks.

## Features

- ✅ **Session-based Authentication** (JWT + httpOnly cookies)
- ✅ **Dynamic Webhook Endpoints** - Create custom webhook paths
- ✅ **LINE Message API Verification** - Validates webhook signatures
- ✅ **Request Storage** - Stores all incoming webhook requests
- ✅ **Request Inspection** - View detailed headers, body, and metadata
- ✅ **Copy to Postman** - Export requests for testing
- ✅ **Fully Serverless** - Runs on Vercel Edge Functions
- ✅ **Responsive UI** - Built with Vue 3 + Tailwind CSS

## Tech Stack

### Frontend
- Vue 3 (Composition API)
- Vue Router
- Axios
- Tailwind CSS
- Vite

### Backend
- Node.js Serverless Functions (Vercel)
- Vercel Postgres (database)
- Vercel KV (Redis for webhook logs)
- JWT authentication
- bcrypt (password hashing)

## Prerequisites

- Node.js 18+ and npm
- Vercel account (free tier works)
- LINE Messaging API Channel (get from LINE Developers Console)

## Local Development

### 1. Clone and Install

```bash
git clone <your-repo>
cd webhook-app
npm install
```

### 2. Set up Vercel CLI

```bash
npm install -g vercel
vercel login
vercel link
```

### 3. Set up Vercel Postgres

```bash
vercel postgres create
```

Follow the prompts to create a database. Then pull the environment variables:

```bash
vercel env pull .env.local
```

### 4. Set up Vercel KV (Redis)

```bash
vercel kv create
```

Again, pull the new environment variables:

```bash
vercel env pull .env.local
```

### 5. Add JWT Secret

Add to your `.env.local`:

```
JWT_SECRET=your-super-secret-key-here
```

### 6. Initialize Database Schema

Connect to your Vercel Postgres and run the schema:

```bash
vercel postgres sql -- "$(cat schema.sql)"
```

Or manually run the SQL from `schema.sql` in your Vercel Postgres dashboard.

### 7. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Deployment to Vercel

### Option 1: Deploy via CLI

```bash
vercel --prod
```

### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables in Vercel:
   - `JWT_SECRET` - Your secret key
   - Postgres and KV variables are auto-set
4. Deploy!

### Post-Deployment

1. Go to Vercel Dashboard → Storage → Postgres
2. Run the SQL from `schema.sql` to create tables
3. Test the app at your Vercel URL

## Usage

### 1. Register/Login

- Visit your deployed URL
- Create an account or login

### 2. Create Webhook Endpoint

- Enter your LINE Channel Secret (from LINE Developers Console)
- Add optional description
- Click "Create Endpoint"
- Copy the generated webhook URL

### 3. Configure LINE Bot

- Go to LINE Developers Console
- Navigate to your Messaging API channel
- Set the webhook URL to your generated endpoint
- Enable "Use webhook"

### 4. Receive Webhooks

- When users interact with your LINE bot, requests appear in "View Logs"
- Click "View Details" to inspect full request
- Click "Copy for Postman" to get formatted request for testing

## API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/register` - Register new user
- `POST /api/logout` - Logout

### Webhook Management
- `GET /api/endpoints` - List user's endpoints
- `POST /api/endpoints` - Create new endpoint
- `DELETE /api/endpoints` - Delete endpoint

### Webhook Receiver
- `POST /api/webhook/:path` - Receive webhooks (LINE signature verified)

### Logs
- `GET /api/logs?endpointId=:id` - Get webhook logs

## Environment Variables

Required in production:

```env
JWT_SECRET=your-secret-key
POSTGRES_URL=<auto-set-by-vercel>
KV_URL=<auto-set-by-vercel>
```

## Security Considerations

1. **Change JWT_SECRET** in production
2. **HTTPS Only** - Vercel provides this automatically
3. **httpOnly Cookies** - Prevents XSS attacks
4. **LINE Signature Verification** - Validates webhook authenticity
5. **User Isolation** - Users can only access their own endpoints

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Webhook Endpoints Table
```sql
CREATE TABLE webhook_endpoints (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    path VARCHAR(255) UNIQUE NOT NULL,
    line_channel_secret VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Webhook Logs Table
```sql
CREATE TABLE webhook_logs (
    id SERIAL PRIMARY KEY,
    endpoint_id INT REFERENCES webhook_endpoints(id),
    log_key VARCHAR(100) NOT NULL,
    method VARCHAR(10),
    received_at TIMESTAMP DEFAULT NOW()
);
```

Full request data stored in Vercel KV with 7-day expiry.

## Troubleshooting

### "Authentication failed"
- Make sure cookies are enabled
- Check if JWT_SECRET is set correctly

### "Missing LINE signature"
- Verify webhook is coming from LINE
- Check LINE Channel Secret is correct

### Database errors
- Run `schema.sql` in Vercel Postgres
- Check connection string in environment variables

### Webhook not receiving
- Verify LINE bot webhook URL is correct
- Check "Use webhook" is enabled in LINE Console
- Test with LINE's webhook tester

## Limitations

- Webhook logs expire after 7 days (Vercel KV retention)
- Free tier limits apply (Postgres, KV, bandwidth)
- Currently only supports LINE Message API webhooks

## Future Enhancements

- [ ] Support multiple webhook providers (Slack, Discord, etc.)
- [ ] Webhook forwarding/relay
- [ ] Custom webhook transformations
- [ ] Email notifications on webhook receipt
- [ ] Advanced filtering and search

## License

MIT

## Support

For issues or questions:
- Check Vercel documentation
- Review LINE Messaging API docs
- Open an issue on GitHub
