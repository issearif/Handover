# DigitalOcean Deployment Guide

## Prerequisites
1. DigitalOcean account
2. Code exported from Replit
3. GitHub repository (recommended)

## Steps to Deploy

### 1. Prepare Your Code
- Download your Replit project as ZIP or push to GitHub
- Ensure all files are included (Dockerfile, app.yaml created)

### 2. Set Up Database
- Go to DigitalOcean Databases
- Create PostgreSQL database (size: Basic $15/month)
- Note the connection string

### 3. Deploy to App Platform
- Go to DigitalOcean App Platform
- Create new app from GitHub or upload source
- Use app.yaml configuration provided
- Set environment variables:
  - DATABASE_URL (from your PostgreSQL database)
  - SESSION_SECRET (generate random string)

### 4. Configure Environment Variables
Required variables:
- NODE_ENV=production
- DATABASE_URL=postgresql://user:pass@host:port/database
- SESSION_SECRET=your-random-secret-key
- PORT=3000

### 5. Authentication Setup
Note: The current app uses Replit OAuth which won't work on DigitalOcean.
You'll need to either:
- Implement alternative authentication (Google OAuth, Auth0)
- Create simple username/password system
- Use DigitalOcean's authentication services

## Cost Estimate
- App Platform Basic: $5/month
- PostgreSQL Database: $15/month
- Total: ~$20/month

## Alternative: Docker Deployment
You can also deploy using Docker:
1. Build: `docker build -t medical-app .`
2. Deploy to DigitalOcean Container Registry
3. Run on Droplet or App Platform