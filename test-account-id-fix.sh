#!/bin/bash

echo "🔍 Testing fixed finance account ID..."
echo "Testing invoice creation with account ID 1 (Kas account)..."

# Test the invoice creation API
curl -X POST http://localhost:3000/api/sync/xendit-to-kledo \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-invoice-' $(date +%s) '",
    "external_id": "test-ext-' $(date +%s) '",
    "amount": 100000,
    "description": "Test invoice with account ID 1",
    "status": "PAID",
    "payer_email": "test@example.com"
  }' \
  | jq '.'

echo ""
echo "✅ Test completed. Check the output above for any 'Business tran id' errors."
