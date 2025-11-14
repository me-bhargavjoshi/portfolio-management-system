#!/bin/bash

# Keka Integration Environment Setup
# Adds Keka configuration to backend .env file

BACKEND_ENV="/Users/detadmin/Documents/Portfolio Management/backend/.env"

echo "🔧 Setting up Keka Integration Environment Variables..."

# Check if .env exists
if [ ! -f "$BACKEND_ENV" ]; then
  echo "⚠️  .env file not found at $BACKEND_ENV"
  echo "Creating new .env file..."
  touch "$BACKEND_ENV"
fi

# Add or update Keka configuration
if grep -q "KEKA_COMPANY_NAME" "$BACKEND_ENV"; then
  echo "✓ Keka configuration already exists in .env"
else
  echo "Adding Keka configuration to .env..."
  cat >> "$BACKEND_ENV" << 'EOF'

# ============================================
# KEKA INTEGRATION CONFIGURATION
# ============================================
# Company: Dynamicelements
# PSA Module: Get clients and projects
# HRIS Module: Get employees

KEKA_COMPANY_NAME=dynamicelements
KEKA_CLIENT_ID=ad066272-fc26-4cb6-8013-0c917b338282
KEKA_CLIENT_SECRET=L0lrngtVKLGBMimNzYNk
KEKA_API_KEY=60X4if7aetHEiCoq1gOhRszm3JhIbMnx3MMhCRZnKhs=
KEKA_TIMEOUT=30000

# Sync schedule (in cron format - optional for future use)
# KEKA_SYNC_SCHEDULE=0 2 * * * # Daily at 2 AM
EOF
  echo "✅ Keka configuration added to .env"
fi

echo ""
echo "✅ Keka integration environment setup complete!"
echo ""
echo "🔑 Configuration Details:"
echo "  • Company: dynamicelements"
echo "  • PSA API: https://dynamicelements.keka.com/api/v1/psa"
echo "  • HRIS API: https://dynamicelements.keka.com/api/v1/hris"
echo ""
echo "📝 Next steps:"
echo "  1. Restart your backend server"
echo "  2. Test connection: POST /api/keka/sync/test"
echo "  3. Start syncing data!"
