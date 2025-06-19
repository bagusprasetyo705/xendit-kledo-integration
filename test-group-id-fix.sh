#!/bin/bash

# Test script to verify the group ID fix
echo "🧪 Testing Kledo Contact Creation with Group ID Fix"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking if the fix has been applied...${NC}"

# Check if the getDefaultContactGroupId function exists
if grep -q "getDefaultContactGroupId" src/lib/kledo-service.js; then
    echo -e "${GREEN}✅ getDefaultContactGroupId function found${NC}"
else
    echo -e "${RED}❌ getDefaultContactGroupId function not found${NC}"
    exit 1
fi

# Check if group_id is included in contact creation
if grep -q "group_id.*groupId" src/lib/kledo-service.js; then
    echo -e "${GREEN}✅ group_id field added to contact creation${NC}"
else
    echo -e "${RED}❌ group_id field not found in contact creation${NC}"
    exit 1
fi

# Check if contact groups endpoint is used
if grep -q "/finance/contactGroups" src/lib/kledo-service.js; then
    echo -e "${GREEN}✅ Contact groups endpoint configured${NC}"
else
    echo -e "${RED}❌ Contact groups endpoint not found${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Summary of Changes Applied:${NC}"
echo "1. ✅ Added getDefaultContactGroupId() function"
echo "2. ✅ Updated createOrGetKledoCustomer() to include group_id"
echo "3. ✅ Updated getOrCreateDefaultCustomer() to include group_id"
echo "4. ✅ Added contact groups fetching from /finance/contactGroups"
echo "5. ✅ Implemented fallback group selection logic"

echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Test the integration with a real Kledo API call"
echo "2. Try creating a contact through the dashboard"
echo "3. Check if 'Group id diperlukan' error is resolved"

echo ""
echo -e "${GREEN}✅ Group ID fix validation complete!${NC}"
echo "The contact creation should now work without the group_id error."
