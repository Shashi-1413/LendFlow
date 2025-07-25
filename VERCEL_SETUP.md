# Vercel Environment Variables Configuration

## Required Environment Variables for Vercel Deployment

When deploying to Vercel, you need to set these environment variables in your Vercel dashboard:

### 1. Database Configuration
```bash
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/lendflow?retryWrites=true&w=majority
```

### 2. Application Settings
```bash
NODE_ENV=production
PORT=3001
```

### 3. Security Settings
```bash
JWT_SECRET=your-super-long-secret-key-for-production-32-characters-minimum
SESSION_SECRET=your-session-secret-key-for-production
```

### 4. CORS Configuration
```bash
CORS_ORIGIN=https://your-vercel-app-name.vercel.app,https://your-custom-domain.com
```

## Fixed Vercel Configuration

**Issue Resolved**: The `functions` property cannot be used with `builds` property.

**Solution**: Updated `vercel.json` to use only the `builds` property with proper routing configuration.

### Current Vercel Structure:
```
/api/server.js - Serverless function (imports server/index.js)
/dist/ - Static frontend files
/vercel.json - Deployment configuration (fixed)
```

### Option 1: Vercel CLI (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Follow prompts to configure

### Option 2: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Connect your GitHub repository
3. Import the LendFlow project
4. Set environment variables in project settings
5. Deploy

## MongoDB Atlas Setup (Required for Vercel):

1. **Create MongoDB Atlas Account**
   - Go to https://cloud.mongodb.com/
   - Sign up for free account

2. **Create Cluster**
   - Choose "Build a Database"
   - Select "Free" tier (M0 Sandbox)
   - Choose cloud provider and region

3. **Create Database User**
   - Go to "Database Access"
   - Add new database user
   - Choose "Password" authentication
   - Save username and password

4. **Configure Network Access**
   - Go to "Network Access"
   - Add IP Address: `0.0.0.0/0` (allows access from anywhere)
   - Or add specific Vercel IPs if preferred

5. **Get Connection String**
   - Go to "Databases" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>` and `<password>` with your credentials

## Environment Variables in Vercel Dashboard:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add each variable:

| Variable | Value | Environment |
|----------|--------|-------------|
| `MONGODB_URI` | Your MongoDB Atlas connection string | Production |
| `NODE_ENV` | `production` | Production |
| `JWT_SECRET` | Your secure JWT secret (32+ chars) | Production |
| `CORS_ORIGIN` | Your Vercel app URL | Production |

## Example Production Values:

```bash
# Production environment variables for Vercel
MONGODB_URI=mongodb+srv://lendflow-user:SecurePassword123@cluster0.abc123.mongodb.net/lendflow?retryWrites=true&w=majority
NODE_ENV=production
JWT_SECRET=lendflow-production-super-secret-jwt-key-2024-very-long-and-secure
SESSION_SECRET=lendflow-production-session-secret-key-2024
CORS_ORIGIN=https://lendflow-app.vercel.app,https://www.lendflow-app.com
```

## Troubleshooting:

### Common Issues:
1. **Database Connection Fails**: Check MongoDB Atlas IP whitelist and credentials
2. **CORS Errors**: Ensure CORS_ORIGIN matches your Vercel domain exactly
3. **Build Fails**: Check that all required environment variables are set

### Vercel Build Commands:
- **Build Command**: `npm run build` (already configured in package.json)
- **Start Command**: `npm start` (already configured in package.json)
- **Install Command**: `npm install` (automatic)

## Testing Deployment:

1. After deployment, test these endpoints:
   - `https://your-app.vercel.app/health` - Should return status OK
   - `https://your-app.vercel.app/api/v1/dashboard` - Should return dashboard data
   - `https://your-app.vercel.app/` - Should load the frontend

2. Check Vercel Function logs for any errors
3. Monitor MongoDB Atlas connection metrics

## Security Checklist:

- [ ] Use strong, unique JWT_SECRET (32+ characters)
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN with your exact domain
- [ ] Use MongoDB Atlas with authentication
- [ ] Enable IP access control in MongoDB Atlas
- [ ] Use HTTPS for all connections (automatic with Vercel)
