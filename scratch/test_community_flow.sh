#!/bin/bash

# Configuration
BASE_URL="http://localhost:8989/api/v1"
EMAIL="testuser_$(date +%s)@example.com"
PASSWORD="Password123!"
USERNAME="testuser_$(date +%s)"

echo "--- 1. Registering Customer ---"
REGISTER_RES=$(curl -s -X POST "$BASE_URL/users/create-customer" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"username\": \"$USERNAME\",
    \"customer\": {
      \"fullName\": \"Test Community User\"
    }
  }")
echo $REGISTER_RES | jq .

echo -e "\n--- 2. Logging In ---"
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
TOKEN=$(echo $LOGIN_RES | jq -r '.data.access_token')

if [ "$TOKEN" == "null" ]; then
  echo "Failed to get token"
  exit 1
fi
echo "Token acquired."

echo -e "\n--- 3. Uploading Community Hero Image ---"
UPLOAD_RES=$(curl -s -X POST "$BASE_URL/communities/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@node_modules/.pnpm/passport@0.7.0/node_modules/passport/sponsors/snyk.png" \
  -F "context=CREATE")
echo $UPLOAD_RES | jq .

FILE_ID=$(echo $UPLOAD_RES | jq -r '.data[0].id')
FILE_URL=$(echo $UPLOAD_RES | jq -r '.data[0].url')

if [ "$FILE_ID" == "null" ]; then
  echo "Failed to upload image"
  exit 1
fi

echo -e "\n--- 4. Creating Community (Step 2) ---"
CREATE_RES=$(curl -s -X POST "$BASE_URL/communities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Community $USERNAME\",
    \"description\": \"A group for testing\",
    \"type\": \"PUBLIC\",
    \"heroImg\": {
      \"fileId\": \"$FILE_ID\",
      \"url\": \"$FILE_URL\"
    }
  }")
echo $CREATE_RES | jq .

echo -e "\n--- 5. Testing Delete Route (Uploading another file first) ---"
UPLOAD_RES2=$(curl -s -X POST "$BASE_URL/communities/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@node_modules/.pnpm/passport@0.7.0/node_modules/passport/sponsors/snyk.png")
echo $UPLOAD_RES2 | jq .
FILE_ID2=$(echo $UPLOAD_RES2 | jq -r '.data[0].id')

echo "Deleting File ID: $FILE_ID2"
DELETE_RES=$(curl -s -X DELETE "$BASE_URL/communities/upload/$FILE_ID2" \
  -H "Authorization: Bearer $TOKEN")
echo $DELETE_RES | jq .

echo -e "\n--- Test Flow Completed ---"
