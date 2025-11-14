# Azure Deployment Guide - Portfolio Management System

## 🔷 Prerequisites

1. **Azure CLI** installed and configured
   ```bash
   # Install Azure CLI (macOS)
   brew install azure-cli
   
   # Login to Azure
   az login
   
   # Set your subscription (if you have multiple)
   az account set --subscription "Your Subscription Name"
   ```

2. **GitHub Repository** - Already set up ✅
   - Repository: https://github.com/me-bhargavjoshi/portfolio-management-system

## 🚀 Quick Deployment (Automated)

### Option 1: One-Click Deployment Script

```bash
cd "/Users/detadmin/Documents/Portfolio Management"
./deploy-azure.sh
```

This script will automatically:
- Create Azure Resource Group
- Set up PostgreSQL Database
- Configure Redis Cache
- Deploy the Web App
- Configure all environment variables

### Option 2: Manual Azure Portal Deployment

1. **Go to Azure Portal**: https://portal.azure.com

2. **Create Resource Group**:
   - Click "Create a resource"
   - Search for "Resource Group"
   - Name: `portfolio-management-rg`
   - Region: `East US`

3. **Create Database**:
   - Search for "Azure Database for PostgreSQL"
   - Choose "Flexible Server"
   - Server name: `portfolio-db-server`
   - Username: `portfolio_admin`
   - Password: Generate secure password
   - Pricing tier: `Burstable B1ms`

4. **Create Redis Cache**:
   - Search for "Azure Cache for Redis"
   - Name: `portfolio-redis-cache`
   - Pricing tier: `Basic C0`

5. **Create Web App**:
   - Search for "App Service"
   - Name: `portfolio-management-app`
   - Runtime: `Node 18 LTS`
   - OS: `Linux`
   - Pricing: `Basic B1`

## ⚙️ Configuration Steps

### 1. Database Setup

After creating the database, run the initialization:

```bash
# Connect to your Azure database
psql "host=portfolio-db-server.postgres.database.azure.com port=5432 dbname=portfolio_management user=portfolio_admin password=YOUR_PASSWORD sslmode=require"

# Run the database schema
\i database/init.sql
```

### 2. Application Settings

In Azure Portal > App Service > Configuration, add these settings:

```
NODE_ENV=production
DATABASE_URL=postgresql://portfolio_admin:PASSWORD@portfolio-db-server.postgres.database.azure.com:5432/portfolio_management?sslmode=require
REDIS_URL=rediss://:PASSWORD@portfolio-redis-cache.redis.cache.windows.net:6380
JWT_SECRET=your-generated-jwt-secret-here
KEKA_CLIENT_ID=your-keka-client-id
KEKA_CLIENT_SECRET=your-keka-client-secret
KEKA_BASE_URL=your-keka-base-url
CORS_ORIGINS=https://portfolio-management-app.azurewebsites.net
PORT=8080
WEBSITE_NODE_DEFAULT_VERSION=18.17.0
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### 3. Deployment Configuration

#### Continuous Deployment from GitHub:

1. In App Service > Deployment Center
2. Choose "GitHub"
3. Select repository: `me-bhargavjoshi/portfolio-management-system`
4. Branch: `main`
5. Build provider: "GitHub Actions"

#### Manual Deployment:

```bash
# Build and deploy
cd backend
npm run build
az webapp up --name portfolio-management-app --resource-group portfolio-management-rg
```

## 🔐 Environment Variables & Secrets

### Required Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `REDIS_URL` | Redis connection string | `rediss://:pass@host:6380` |
| `JWT_SECRET` | JWT signing secret | `your-64-char-secret` |
| `KEKA_CLIENT_ID` | Keka OAuth client ID | `your-keka-client-id` |
| `KEKA_CLIENT_SECRET` | Keka OAuth secret | `your-keka-secret` |
| `KEKA_BASE_URL` | Your Keka instance URL | `https://yourcompany.keka.com` |

### Generate Secure Secrets:

```bash
# JWT Secret
openssl rand -base64 64 | tr -d "=+/"

# Database Password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
```

## 🌐 Domain & SSL Configuration

### Custom Domain:

1. In App Service > Custom domains
2. Add your domain
3. Configure DNS records:
   ```
   Type: CNAME
   Name: portfolio (or www)
   Value: portfolio-management-app.azurewebsites.net
   ```

### SSL Certificate:

1. In App Service > TLS/SSL settings
2. Choose "Private Key Certificates (.pfx)"
3. Upload your certificate or use App Service Managed Certificate

## 📊 Monitoring & Logging

### Application Insights:

```bash
# Enable Application Insights
az webapp config appsettings set \
  --name portfolio-management-app \
  --resource-group portfolio-management-rg \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="your-connection-string"
```

### View Logs:

```bash
# Stream logs
az webapp log tail --name portfolio-management-app --resource-group portfolio-management-rg

# Download logs
az webapp log download --name portfolio-management-app --resource-group portfolio-management-rg
```

## 🧪 Testing Your Deployment

### Health Check:

```bash
curl https://portfolio-management-app.azurewebsites.net/api/health
```

### Full Application Test:

1. Visit: `https://portfolio-management-app.azurewebsites.net`
2. Check API: `https://portfolio-management-app.azurewebsites.net/api/health`
3. Test login functionality
4. Verify Keka integration
5. Test data synchronization

## 💰 Cost Estimation

**Monthly costs (approximate)**:
- App Service (B1): $13.14/month
- PostgreSQL (B1ms): $12.41/month  
- Redis Cache (C0): $16.06/month
- **Total**: ~$42/month

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Verify firewall rules allow Azure services
   - Check SSL configuration
   - Confirm connection string format

2. **App Won't Start**:
   - Check application logs
   - Verify Node.js version
   - Confirm all environment variables are set

3. **Keka Integration Issues**:
   - Update redirect URIs in Keka settings
   - Verify client credentials
   - Check CORS configuration

### Debug Commands:

```bash
# Check app service logs
az webapp log tail --name portfolio-management-app --resource-group portfolio-management-rg

# Test database connection
az postgres flexible-server connect --name portfolio-db-server --admin-user portfolio_admin

# Restart app service
az webapp restart --name portfolio-management-app --resource-group portfolio-management-rg
```

## 📞 Support

- **Azure Support**: https://azure.microsoft.com/support/
- **GitHub Issues**: https://github.com/me-bhargavjoshi/portfolio-management-system/issues
- **Documentation**: https://docs.microsoft.com/azure/app-service/

---

**Deployment Status**: Ready for Azure ✅
**Estimated Setup Time**: 15-30 minutes
**Next Step**: Run `./deploy-azure.sh` or follow manual steps