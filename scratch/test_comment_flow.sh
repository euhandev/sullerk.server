#!/bin/bash

# Configuration
API_URL="http://localhost:8989/api/v1"
TS=$(date +%s)
RAND=$RANDOM
USER_EMAIL="commenter_${TS}_${RAND}@test.com"
PASSWORD="Password123!"

echo "🚀 Starting Automated Comment Flow Test..."

# Helper function to get token
get_token() {
  curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$1\", \"password\": \"$2\"}" | jq -r '.data.access_token'
}

# 1. Register User
echo -e "\n[1] Registering User..."
curl -s -X POST "$API_URL/users/create-customer" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"contactNo\": \"03${TS:2:8}${RAND:0:1}\",
    \"username\": \"user_$TS\",
    \"customer\": { \"fullName\": \"Test Commenter\" }
  }" > /dev/null

# 2. Get Token
echo -e "\n[2] Authenticating..."
TOKEN=$(get_token "$USER_EMAIL" "$PASSWORD")
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed."
  exit 1
fi

# 3. Create a Post (to comment on)
echo -e "\n[3] Creating a Post..."
POST_RESP=$(curl -s -X POST "$API_URL/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{ \"description\": \"This post is for commenting test!\" }")
POST_ID=$(echo $POST_RESP | jq -r '.data.id')
echo "Post Created: ID $POST_ID"

# 4. Add a Comment
echo -e "\n[4] Adding a Comment..."
COMMENT_RESP=$(curl -s -X POST "$API_URL/post/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{ \"postId\": \"$POST_ID\", \"body\": \"This is my first comment! 🔥\" }")
COMMENT_ID=$(echo $COMMENT_RESP | jq -r '.data.id')
echo "Comment Added: ID $COMMENT_ID"

# 5. Get Comments for Post
echo -e "\n[5] Retrieving Comments for Post $POST_ID..."
curl -s -X GET "$API_URL/post/$POST_ID/comments" | jq '.'

# 6. Delete Comment
echo -e "\n[6] Deleting Comment $COMMENT_ID..."
curl -s -X DELETE "$API_URL/post/comments/$COMMENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n✅ Comment Flow Test Completed!"
