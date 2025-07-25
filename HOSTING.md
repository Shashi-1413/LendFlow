# LendFlow Hosting Configuration Guide

## Environment Variables for Production Hosting

### Required Variables:
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lendflow?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=https://yourdomain.com
```

## Hosting Platform Configurations

### 1. Vercel (Recommended for Frontend + API)
```bash
# vercel.json configuration
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

### 2. Railway (Full-Stack Hosting)
```bash
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"

# Environment Variables (set in Railway dashboard):
NODE_ENV=production
MONGODB_URI=your-mongodb-atlas-uri
PORT=3001
```

### 3. Render (Web Service)
```bash
# Build Command: npm install && npm run build
# Start Command: npm start

# Environment Variables:
NODE_ENV=production
MONGODB_URI=your-mongodb-atlas-uri
```

### 4. Heroku
```bash
# Procfile
web: node server/index.js

# Environment Variables (set via Heroku CLI or dashboard):
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
```

### 5. DigitalOcean App Platform
```yaml
# .do/app.yaml
name: lendflow
services:
- name: web
  source_dir: /
  github:
    repo: Shashi-1413/LendFlow
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    value: your-mongodb-atlas-uri
```

## MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com/
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for all IPs)
5. Get your connection string
6. Replace in MONGODB_URI

## Security Checklist

- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Configure CORS_ORIGIN with your actual domain
- [ ] Use MongoDB Atlas with authentication
- [ ] Set NODE_ENV=production
- [ ] Never commit .env file to git
- [ ] Use environment variables for all secrets
