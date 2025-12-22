#!/bin/bash

# Generate the token
TOKEN=$(go run generate_token.go)
TIMESTAMP=$(date +%s)
ACTIVITY_ID="$1"

if [ -z "$ACTIVITY_ID" ]; then
    echo "Please provide an activity ID as the first argument"
    echo "Usage: ./test_bundle_ids.sh <ACTIVITY_ID> [<DEVICE_TOKEN>]"
    exit 1
fi

# Use the provided device token or a default one
DEVICE_TOKEN="$2"
if [ -z "$DEVICE_TOKEN" ]; then
    echo "Using default device token. Provide a device token as second argument for your specific device."
    DEVICE_TOKEN="3d819178be7d83940fd978765b800f27c483b0f24be16ff8f543362e4f75d193"
fi

# Create a json file for debugging
JSON_PAYLOAD=$(cat <<EOF
{
    "aps": {
        "event": "update",
        "timestamp": $TIMESTAMP,
        "content-state": {
            "status": "pending",
            "responseTime": "2024-04-09T13:07:45Z",
            "respondedBy": "Selina"
        }
    },
    "activity-id": "$ACTIVITY_ID"
}
EOF
)

echo "$JSON_PAYLOAD" > payload.json
echo "JSON payload saved to payload.json for verification:"
cat payload.json

# Try different bundle ID formats
BUNDLE_IDS=(
    "com.leo.HSANNU"
    "UOEXCC8WDZ.com.leo.HSANNU"
    "com.leo.HSANNU-UOEXCC8WDZ"
    "team.hsannu"
    "team.hsannu.app"
    "com.apple.HSANNU"
)

for BUNDLE_ID in "${BUNDLE_IDS[@]}"; do
    TOPIC="${BUNDLE_ID}.push-type.liveactivity"
    
    echo "----------------------------------------------"
    echo "Testing bundle ID: $BUNDLE_ID"
    echo "Full topic: $TOPIC"
    
    echo "Sending Live Activity update notification..."
    curl -v \
    --header "authorization: Bearer $TOKEN" \
    --header "apns-topic: $TOPIC" \
    --header "apns-push-type: liveactivity" \
    --header "apns-priority: 10" \
    --header "content-type: application/json" \
    --header "apns-development: true" \
    --data @payload.json \
    --http2 \
    https://api.development.push.apple.com/3/device/$DEVICE_TOKEN 2>&1 | grep -E "HTTP|reason|error"
    
    echo ""
    echo "Test for $TOPIC completed"
    echo "----------------------------------------------"
    echo ""
    
    # Wait a bit between tests
    sleep 1
done

echo "All bundle ID tests completed. Check the results above to find a successful topic." 