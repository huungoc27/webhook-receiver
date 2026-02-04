# Vercel Deployment Guide - Step by Step

This guide walks you through deploying the Webhook Receiver app to Vercel.

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Vercel account (sign up at vercel.com)
- [ ] LINE Developers account (for LINE Channel Secret)
- [ ] Git installed on your computer

## Step 1: Prepare Your Code

### 1.1 Initialize Git Repository

```bash
cd webhook-app
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create GitHub Repository

1. Go to github.com
2. Click "New repository"
3. Name it "webhook-receiver" (or any name)
4. **Don't** initialize with README
5. Click "Create repository"

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/webhook-receiver.git
git branch -M main
git push -u origin main
```

## Step 2: Import to Vercel

### 2.1 Login to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Login with GitHub

### 2.2 Import Project

1. Click "Add New..." → "Project"
2. Select your GitHub repository "webhook-receiver"
3. Click "Import"

### 2.3 Configure Project

- **Framework Preset**: Vite
- **Root Directory**: ./
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Don't deploy yet!** Click "Environment Variables" first.

## Step 3: Set Up Environment Variables

### 3.1 Add JWT Secret

1. In the import screen, expand "Environment Variables"
2. Add variable:
   - **Name**: `JWT_SECRET`
   - **Value**: Generate a random string (e.g., use: `openssl rand -base64 32`)
   - **Environment**: Production, Preview, Development (check all)

## Step 4: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for deployment
3. You'll see "Congratulations!" when done
4. Note your deployment URL (e.g., `webhook-receiver.vercel.app`)

## Step 5: Set Up Vercel Postgres

### 5.1 Create Database

1. Go to your project dashboard in Vercel
2. Click "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose your region (closest to users)
6. Click "Create"

### 5.2 Connect Database to Project

1. After creation, click "Connect Project"
2. Select your environment (Production + Development)
3. Click "Connect"

### 5.3 Initialize Database Schema

**Option A: Using Vercel Dashboard**
1. In Storage → Postgres, click ".sql" tab
2. Click "Query"
3. Paste contents of `schema.sql`
4. Click "Run Query"

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel link
vercel postgres sql -- "$(cat schema.sql)"
```

## Step 6: Set Up Vercel KV (Redis)

### 6.1 Create KV Store

1. In your project, go to "Storage" tab
2. Click "Create Database"
3. Select "KV" (Redis)
4. Name it "webhook-logs"
5. Choose your region
6. Click "Create"

### 6.2 Connect KV to Project

1. Click "Connect Project"
2. Select environments (Production + Development)
3. Click "Connect"

## Step 7: Redeploy

After adding Postgres and KV:

1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for redeployment to complete

## Step 8: Test Your Application

### 8.1 Access Your App

1. Click "Visit" on your deployment
2. You should see the login page

### 8.2 Create Test Account

1. Click "Need an account? Sign up"
2. Create username and password
3. You should be redirected to dashboard

### 8.3 Create Webhook Endpoint

1. In dashboard, enter your LINE Channel Secret
   - Get this from [LINE Developers Console](https://developers.line.biz/console/)
   - Go to your channel → Messaging API → Channel secret
2. Click "Create Endpoint"
3. Copy the generated webhook URL

### 8.4 Configure LINE Bot

1. Go to LINE Developers Console
2. Select your channel
3. Go to "Messaging API" tab
4. Set "Webhook URL" to your generated endpoint
5. Enable "Use webhook"
6. Click "Verify" to test

## Step 9: Monitor and Debug

### View Logs

```bash
vercel logs --follow
```

Or in Vercel Dashboard:
- Go to your project
- Click "Logs" tab
- See real-time function invocations

### Check Database

1. Storage → Postgres → Data tab
2. Run queries to check data:
```sql
SELECT * FROM users;
SELECT * FROM webhook_endpoints;
SELECT * FROM webhook_logs;
```

## Troubleshooting

### Issue: "Internal Server Error"

**Solution**: Check function logs
```bash
vercel logs --follow
```

Look for error messages about missing environment variables.

### Issue: "Database connection failed"

**Solution**: 
1. Verify Postgres is connected to project
2. Redeploy after adding Postgres
3. Check environment variables are present

### Issue: "Webhook signature invalid"

**Solution**:
1. Verify LINE Channel Secret is correct
2. Check webhook is coming from LINE (not browser)
3. Test with LINE's webhook testing tool

### Issue: "Session/Cookie not working"

**Solution**:
1. Ensure you're using HTTPS (Vercel provides this)
2. Check browser allows cookies
3. Verify JWT_SECRET is set

## Performance Optimization

### Enable Edge Functions (Optional)

Add to `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "edge"
    }
  }
}
```

### Database Connection Pooling

Vercel Postgres automatically uses connection pooling via `POSTGRES_PRISMA_URL`.

## Cost Estimation (Free Tier)

- **Vercel Hosting**: Free
- **Postgres**: Free for 256MB (upgrade at $20/month for 512MB)
- **KV Redis**: Free for 256MB, 100k requests/day
- **Bandwidth**: 100GB/month free

You can monitor usage in Vercel Dashboard → Usage tab.

## Going to Production

### Custom Domain

1. Go to project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration steps

### Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable 2FA on Vercel account
- [ ] Set up monitoring/alerts
- [ ] Review and limit API rate limits if needed
- [ ] Keep dependencies updated

### Monitoring

Set up monitoring:
1. Vercel Analytics (built-in)
2. Error tracking (Sentry, etc.)
3. Uptime monitoring (UptimeRobot, etc.)

## Updating Your App

### Push Changes

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel automatically deploys when you push to GitHub!

### Rollback if Needed

1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [LINE Messaging API Docs](https://developers.line.biz/en/docs/messaging-api/)

## Next Steps

- Set up custom domain
- Add more webhook providers
- Implement webhook forwarding
- Add email notifications
- Create API documentation

---

**Congratulations! Your webhook receiver is live! 🎉**
