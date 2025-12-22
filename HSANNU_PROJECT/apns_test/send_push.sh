#!/bin/bash

# Generate the token
TOKEN=$(go run generate_token.go)
TIMESTAMP=$(date +%s)
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Using token: $TOKEN"
echo "Timestamp: $TIMESTAMP"
echo "Current time: $CURRENT_TIME"

echo "Sending a simple push notification..."
curl -v \
--header "authorization: Bearer $TOKEN" \
--header "apns-topic: com.leo.hsannu" \
--header "apns-push-type: alert" \
--header "apns-priority: 10" \
--header "apns-development: true" \
--data '{
    "aps": {
        "alert": {
            "title": "Test Notification",
            "body": "This is a test notification from the command line"
        },
        "badge": 1,
        "sound": "default"
    }
}' \
--http2 \
https://api.development.push.apple.com/3/device/3d819178be7d83940fd978765b800f27c483b0f24be16ff8f543362e4f75d193
