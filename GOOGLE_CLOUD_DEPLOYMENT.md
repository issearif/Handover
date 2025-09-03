# Google Cloud Deployment Guide

## Prerequisites
1. Google Cloud account with billing enabled
2. Google Cloud SDK (gcloud) installed locally
3. Your application code exported from Replit

## Step 1: Set Up Google Cloud Project
```bash
# Install Google Cloud CLI if not already installed
# Visit: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Create new project
gcloud projects create medical-handover-app-[UNIQUE-ID]

# Set project
gcloud config set project medical-handover-app-[UNIQUE-ID]

# Enable required APIs
gcloud services enable appengine.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Step 2: Set Up Cloud SQL Database
```bash
# Create PostgreSQL instance (smallest size for cost savings)
gcloud sql instances create medical-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=20GB

# Create database
gcloud sql databases create medical_handover --instance=medical-db

# Create user
gcloud sql users create app-user --instance=medical-db --password=secure-password

# Get connection name for later
gcloud sql instances describe medical-db --format="value(connectionName)"
```

## Step 3: Configure Authentication
Since this app uses Replit OAuth, you'll need to replace it:

**Option A: Simple Username/Password**
- Keep the existing admin user system
- Remove Replit OAuth dependencies

**Option B: Google OAuth**
- Set up Google OAuth in Google Cloud Console
- Update authentication code

## Step 4: Update Configuration Files

Replace your package.json scripts with package.json.gcp content:
```json
{
  "scripts": {
    "start": "NODE_ENV=production PORT=8080 node dist/index.js",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist && cp -r dist/public/* server/public/"
  }
}
```

Update app.yaml environment variables:
```yaml
env_variables:
  NODE_ENV: production
  SESSION_SECRET: your-very-secure-secret-key
  DATABASE_URL: postgresql://app-user:secure-password@/medical_handover?host=/cloudsql/PROJECT_ID:us-central1:medical-db
```

## Step 5: Deploy Application

**Method 1: App Engine (Recommended)**
```bash
# Initialize App Engine
gcloud app create --region=us-central1

# Deploy application
gcloud app deploy app.yaml

# View logs
gcloud app logs tail -s default
```

**Method 2: Cloud Run**
```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/medical-handover-app

# Deploy to Cloud Run
gcloud run deploy medical-handover-app \
    --image gcr.io/PROJECT_ID/medical-handover-app \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --add-cloudsql-instances PROJECT_ID:us-central1:medical-db
```

## Step 6: Set Up Database Schema
```bash
# Connect to your deployed app and run migrations
# This depends on your authentication setup
```

## Step 7: Configure Custom Domain (Optional)
```bash
# Map custom domain
gcloud app domain-mappings create yourdomain.com
```

## Cost Estimates

**Development Setup:**
- App Engine: $0-5/month (free tier)
- Cloud SQL db-f1-micro: ~$10/month
- **Total: $10-15/month**

**Production Setup:**
- App Engine: $5-20/month
- Cloud SQL dedicated: $159-282/month
- **Total: $164-302/month**

## Important Notes

1. **Authentication**: You'll need to replace Replit OAuth
2. **Database**: Update connection strings for Cloud SQL
3. **Environment**: Change PORT from 5000 to 8080 for App Engine
4. **Secrets**: Store sensitive data in Google Secret Manager
5. **Monitoring**: Enable Cloud Monitoring for production

## Troubleshooting
- Check logs: `gcloud app logs tail -s default`
- Debug builds: `gcloud builds log BUILD_ID`
- Database connection: Use Cloud SQL Proxy for local testing