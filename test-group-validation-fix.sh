#!/bin/bash

# Test Group ID Validation Fix
echo "🧪 Testing Group ID Validation Fix..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Test Plan:${NC}"
echo "1. Test group fetching and validation"
echo "2. Test contact creation with validated group ID"
echo "3. Test error handling for invalid group IDs"
echo ""

# Function to test group ID validation
test_group_validation() {
    echo -e "${YELLOW}🔍 Testing Group ID Validation...${NC}"
    
    # Create a simple test script
    cat > test-group-validation.js << 'EOF'
const fetch = require('node-fetch');

// Mock access token for testing (replace with real token)
const ACCESS_TOKEN = process.env.KLEDO_ACCESS_TOKEN || 'mock-token';
const API_BASE_URL = process.env.KLEDO_API_BASE_URL || 'https://bagus2.api.kledo.com';

async function testGroupValidation() {
    console.log('🧪 Testing Group ID Validation...');
    
    try {
        // Test 1: Fetch contact groups
        console.log('\n📋 Test 1: Fetching Contact Groups');
        const response = await fetch(`${API_BASE_URL}/finance/contactGroups`, {
            headers: {
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "Accept": "application/json",
            },
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Contact groups fetched successfully');
            console.log(`📊 Found ${result.data?.length || 0} groups`);
            
            if (result.data && result.data.length > 0) {
                console.log('📊 Available groups:');
                result.data.forEach((group, index) => {
                    console.log(`   ${index + 1}. ${group.name} (ID: ${group.id}, Active: ${group.active !== false})`);
                });
                
                // Test 2: Validate a group ID
                console.log('\n📋 Test 2: Validating Group IDs');
                const firstGroup = result.data[0];
                await testSingleGroupValidation(firstGroup.id, ACCESS_TOKEN, API_BASE_URL);
                
                // Test 3: Test invalid group ID
                console.log('\n📋 Test 3: Testing Invalid Group ID');
                await testSingleGroupValidation(99999, ACCESS_TOKEN, API_BASE_URL);
                
            } else {
                console.log('⚠️ No contact groups found');
            }
        } else {
            console.log(`❌ Failed to fetch groups: ${response.status}`);
            console.log('ℹ️ This might be due to authentication - check your KLEDO_ACCESS_TOKEN');
        }
        
    } catch (error) {
        console.log(`❌ Test error: ${error.message}`);
        console.log('ℹ️ Set KLEDO_ACCESS_TOKEN environment variable for real testing');
    }
}

async function testSingleGroupValidation(groupId, accessToken, apiBase) {
    try {
        const response = await fetch(`${apiBase}/finance/contactGroups/${groupId}`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json",
            },
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Group ID ${groupId} is valid: ${result.data?.name}`);
            return true;
        } else {
            console.log(`❌ Group ID ${groupId} is invalid: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Could not validate group ID ${groupId}: ${error.message}`);
        return false;
    }
}

// Run the test
testGroupValidation();
EOF

    # Run the test
    if command -v node >/dev/null 2>&1; then
        echo -e "${BLUE}🚀 Running group validation test...${NC}"
        node test-group-validation.js
    else
        echo -e "${RED}❌ Node.js not found. Please install Node.js to run the test.${NC}"
    fi
    
    # Clean up
    rm -f test-group-validation.js
}

# Function to test the fix in the actual codebase
test_code_fix() {
    echo -e "${YELLOW}🔧 Testing Code Fix Implementation...${NC}"
    
    # Check if the validation function exists
    if grep -q "validateGroupId" src/lib/kledo-service.js; then
        echo -e "${GREEN}✅ validateGroupId function found${NC}"
    else
        echo -e "${RED}❌ validateGroupId function not found${NC}"
    fi
    
    # Check if active group filtering exists
    if grep -q "group.active !== false" src/lib/kledo-service.js; then
        echo -e "${GREEN}✅ Active group filtering implemented${NC}"
    else
        echo -e "${RED}❌ Active group filtering not found${NC}"
    fi
    
    # Check if integer casting exists
    if grep -q "parseInt.*group.*id" src/lib/kledo-service.js; then
        echo -e "${GREEN}✅ Integer casting implemented${NC}"
    else
        echo -e "${RED}❌ Integer casting not found${NC}"
    fi
    
    # Check if enhanced error handling exists
    if grep -q "errorData.message.*group" src/lib/kledo-service.js; then
        echo -e "${GREEN}✅ Enhanced error handling implemented${NC}"
    else
        echo -e "${RED}❌ Enhanced error handling not found${NC}"
    fi
}

# Function to show next steps
show_next_steps() {
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo ""
    echo "1. 🔑 Set up authentication:"
    echo "   export KLEDO_ACCESS_TOKEN='your-access-token'"
    echo "   export KLEDO_API_BASE_URL='https://bagus2.api.kledo.com'"
    echo ""
    echo "2. 🧪 Run real API test:"
    echo "   ./test-group-validation-fix.sh"
    echo ""
    echo "3. 🚀 Deploy and test in production:"
    echo "   npm run build"
    echo "   npm run start"
    echo ""
    echo "4. 📊 Monitor logs for:"
    echo "   - '✅ Using customer group:' messages"
    echo "   - '📊 Available groups:' debug info"
    echo "   - No more 'Group id yang dipilih tidak valid' errors"
    echo ""
    echo "5. 🔍 If issues persist:"
    echo "   - Check Kledo account has active contact groups"
    echo "   - Verify OAuth permissions include contact management"
    echo "   - Review API response format changes"
}

# Main execution
echo -e "${BLUE}🧪 Starting Group ID Validation Fix Test${NC}"
echo ""

# Test the code implementation
test_code_fix
echo ""

# Test group validation (if token available)
if [ -n "$KLEDO_ACCESS_TOKEN" ]; then
    test_group_validation
else
    echo -e "${YELLOW}⚠️ KLEDO_ACCESS_TOKEN not set - skipping API tests${NC}"
    echo "Set KLEDO_ACCESS_TOKEN to run live API validation tests"
fi

echo ""
show_next_steps

echo ""
echo -e "${GREEN}✅ Group ID Validation Fix Test Complete${NC}"
echo "=================================="
