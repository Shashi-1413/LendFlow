# LendFlow Deployment Guide

## Quick Deployment Steps

### 1. Database Setup (MongoDB Atlas)
1. Create account at https://cloud.mongodb.com/
2. Create a new cluster (free tier available)
3. Create database user with read/write access
4. Whitelist IP addresses (0.0.0.0/0 for any IP)
5. Get connection string

### 2. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your actual values:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lendflow
   JWT_SECRET=your-super-secret-key-min-32-characters
   CORS_ORIGIN=https://yourdomain.com
   ```

### 3. Deploy to Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel dashboard
5. Your app will be live at: `https://your-app.vercel.app`

### 4. Deploy to Railway
1. Connect GitHub repo at https://railway.app/
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### 5. Deploy to Render
1. Connect GitHub repo at https://render.com/
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add environment variables

## Environment Variables for Production

**Required:**
- `NODE_ENV=production`
- `MONGODB_URI=your-mongodb-atlas-connection-string`
- `PORT=3001` (or let hosting platform set it)

**Recommended:**
- `JWT_SECRET=your-32-character-secret-key`
- `CORS_ORIGIN=https://yourdomain.com`

**Optional:**
- `API_RATE_LIMIT=100`
- `MAX_JSON_SIZE=10mb`

## Custom Domain Setup
1. Purchase domain from provider (Namecheap, GoDaddy, etc.)
2. Add CNAME record pointing to your hosting platform
3. Update CORS_ORIGIN in environment variables
4. Enable HTTPS (usually automatic on modern platforms)

## Monitoring and Maintenance
- Check application logs regularly
- Monitor database usage and performance
- Set up uptime monitoring (UptimeRobot, etc.)
- Regular security updates

## Troubleshooting
- Check environment variables are set correctly
- Verify MongoDB connection string
- Ensure CORS origins include your domain
- Check application logs for errors
