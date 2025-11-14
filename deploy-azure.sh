#!/bin/bash

# Azure Deployment Script for Portfolio Management System
# Prerequisites: Azure CLI installed and logged in

set -e

echo "🔷 Starting Azure deployment for Portfolio Management System..."

# Variables
RESOURCE_GROUP="portfolio-management-rg"
LOCATION="eastus"
APP_NAME="portfolio-management-app"
DB_SERVER_NAME="portfolio-db-server"
DB_NAME="portfolio_management"
REDIS_NAME="portfolio-redis-cache"
DB_ADMIN_USER="portfolio_admin"

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/")

echo "📝 Configuration:"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "App Name: $APP_NAME"
echo "Database Server: $DB_SERVER_NAME"
echo "Redis Cache: $REDIS_NAME"

# Create Resource Group
echo "🏗️  Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Database for PostgreSQL
echo "🗄️  Creating PostgreSQL database..."
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password $DB_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --yes

# Create database
echo "📊 Creating database..."
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME

# Configure firewall for Azure services
echo "🔥 Configuring database firewall..."
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create Redis Cache
echo "🔴 Creating Redis cache..."
az redis create \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --location $LOCATION \
  --sku Basic \
  --vm-size c0 \
  --enable-non-ssl-port false \
  --minimum-tls-version 1.2

# Create App Service Plan
echo "📋 Creating App Service plan..."
az appservice plan create \
  --resource-group $RESOURCE_GROUP \
  --name "$APP_NAME-plan" \
  --location $LOCATION \
  --is-linux \
  --sku B1

# Create Web App
echo "🚀 Creating Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "$APP_NAME-plan" \
  --name $APP_NAME \
  --runtime "NODE|18-lts" \
  --deployment-source-url https://github.com/me-bhargavjoshi/portfolio-management-system.git \
  --deployment-source-branch main

# Get connection strings
echo "🔗 Getting connection strings..."
DB_CONNECTION_STRING=$(az postgres flexible-server show-connection-string \
  --server-name $DB_SERVER_NAME \
  --admin-user $DB_ADMIN_USER \
  --admin-password $DB_PASSWORD \
  --database-name $DB_NAME \
  --query connectionStrings.psql_cmd \
  --output tsv)

REDIS_CONNECTION_STRING=$(az redis show-connection-string \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --query primaryConnectionString \
  --output tsv)

# Configure App Settings
echo "⚙️  Configuring application settings..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="postgresql://$DB_ADMIN_USER:$DB_PASSWORD@$DB_SERVER_NAME.postgres.database.azure.com:5432/$DB_NAME?sslmode=require" \
    REDIS_URL="$REDIS_CONNECTION_STRING" \
    JWT_SECRET="$JWT_SECRET" \
    PORT=8080 \
    WEBSITE_NODE_DEFAULT_VERSION=18.17.0 \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Enable logging
echo "📋 Enabling application logging..."
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem

echo "✅ Azure deployment completed!"
echo ""
echo "🔗 Your application URLs:"
echo "Web App: https://$APP_NAME.azurewebsites.net"
echo "Database: $DB_SERVER_NAME.postgres.database.azure.com"
echo "Redis: $REDIS_NAME.redis.cache.windows.net"
echo ""
echo "🔐 Save these credentials securely:"
echo "Database User: $DB_ADMIN_USER"
echo "Database Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo ""
echo "📝 Next steps:"
echo "1. Update your Keka integration settings with the new domain"
echo "2. Configure custom domain if needed"
echo "3. Set up SSL certificate"
echo "4. Monitor logs: az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME"