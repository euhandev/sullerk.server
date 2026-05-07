#!/bin/bash

# Configuration
API_URL="http://localhost:8989/api/v1"
TS=$(date +%s)
RAND=$RANDOM
SELLER_EMAIL="seller_${TS}_${RAND}@test.com"
BUYER_EMAIL="buyer_${TS}_${RAND}@test.com"
PASSWORD="Password123!"

echo "🚀 Starting Automated Commerce Flow Test..."

# Helper function to get token
get_token() {
  local email=$1
  local password=$2
  curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$email\", \"password\": \"$password\"}" | jq -r '.data.access_token'
}

# 1. Register Seller
echo -e "\n[1] Registering Seller ($SELLER_EMAIL)..."
curl -s -X POST "$API_URL/users/create-customer" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$SELLER_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"contactNo\": \"01${TS:2:8}${RAND:0:1}\",
    \"username\": \"seller_${TS}_${RAND}\",
    \"customer\": { \"fullName\": \"Test Seller\" }
  }" | jq '.'

# 2. Register Buyer
echo -e "\n[2] Registering Buyer ($BUYER_EMAIL)..."
curl -s -X POST "$API_URL/users/create-customer" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$BUYER_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"contactNo\": \"02${TS:2:8}${RAND:0:1}\",
    \"username\": \"buyer_${TS}_${RAND}\",
    \"customer\": { \"fullName\": \"Test Buyer\" }
  }" | jq '.'

# 3. Get Tokens
echo -e "\n[3] Authenticating..."
SELLER_TOKEN=$(get_token "$SELLER_EMAIL" "$PASSWORD")
BUYER_TOKEN=$(get_token "$BUYER_EMAIL" "$PASSWORD")

if [ "$SELLER_TOKEN" == "null" ] || [ "$BUYER_TOKEN" == "null" ] || [ -z "$SELLER_TOKEN" ]; then
  echo "❌ Login failed. Check API connectivity or user status."
  exit 1
fi
echo "Tokens acquired."

# 4. Create Listing (Seller)
echo -e "\n[4] Creating Listing as Seller..."
LISTING_RESP=$(curl -s -X POST "$API_URL/listings" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Rare Vintage Jersey\",
    \"description\": \"A rare 1990s signed jersey\",
    \"initialPrice\": 150,
    \"estimatedBaseValue\": 150,
    \"isTradingEnable\": true,
    \"listingType\": \"SELL\"
  }")
LISTING_ID=$(echo $LISTING_RESP | jq -r '.data.id')
SELLER_ID=$(echo $LISTING_RESP | jq -r '.data.ownerId')
echo "Listing Created: ID $LISTING_ID (Owner: $SELLER_ID)"

# 5. Test Direct Purchase Initiation
echo -e "\n[5] Buyer initiating purchase for Listing $LISTING_ID..."
curl -s -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"listingId\": \"$LISTING_ID\"}" | jq '.'

# 6. Test Exchange Offer Initiation
echo -e "\n[6] Creating Listing for Buyer (to trade)..."
BUYER_LISTING_RESP=$(curl -s -X POST "$API_URL/listings" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Commemorative Coin\",
    \"description\": \"Silver coin for trade\",
    \"initialPrice\": 50,
    \"estimatedBaseValue\": 50,
    \"isTradingEnable\": true,
    \"listingType\": \"TRADE\"
  }")
BUYER_LISTING_ID=$(echo $BUYER_LISTING_RESP | jq -r '.data.id')

echo -e "\n[7] Buyer sending Exchange Offer..."
curl -s -X POST "$API_URL/exchanges" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"receiverId\": \"$SELLER_ID\",
    \"senderListingIds\": [\"$BUYER_LISTING_ID\"],
    \"receiverListingIds\": [\"$LISTING_ID\"],
    \"note\": \"Trading my coin for your jersey!\"
  }" | jq '.'

# 7. Test History Routes
echo -e "\n[8] Checking Buyer Purchase History..."
curl -s -X GET "$API_URL/orders/history?type=buy" \
  -H "Authorization: Bearer $BUYER_TOKEN" | jq '.data | .[0]'

echo -e "\n[9] Checking Buyer Exchange History..."
curl -s -X GET "$API_URL/exchanges/history" \
  -H "Authorization: Bearer $BUYER_TOKEN" | jq '.data | .[0]'

echo -e "\n✅ Commerce Flow Test Completed!"
