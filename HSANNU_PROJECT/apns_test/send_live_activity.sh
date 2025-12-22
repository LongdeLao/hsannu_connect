#!/bin/bash

# Generate the token
TOKEN=$(go run generate_token.go)
TIMESTAMP=$(date +%s)
ACTIVITY_ID="$1"

if [ -z "$ACTIVITY_ID" ]; then
    echo "Please provide an activity ID as the first argument"
    echo "Usage: ./send_live_activity.sh <ACTIVITY_ID> [<DEVICE_TOKEN>]"
    exit 1
fi

# Use the provided device token or a default one
DEVICE_TOKEN="$2"
if [ -z "$DEVICE_TOKEN" ]; then
    echo "Using default device token. Provide a device token as second argument for your specific device."
    DEVICE_TOKEN="80c1988ac32f3c8c50f12a148d75cf65426caad39c2894108dd42f151653757593323afc81d21f34de61e8dc3ffa9c5961efedc25cacc498b5ace6e009d21ade1d9c973b0678ebd3c1ac0b7e9ac65b75
"
    
fi

# Use the correct case-sensitive bundle ID
BUNDLE_ID="com.leo.hsannu"

# Get the current unix timestamp
CURRENT_TIMESTAMP=$(date +%s)

echo "Using token: $TOKEN"
echo "Timestamp: $TIMESTAMP"
echo "Activity ID: $ACTIVITY_ID"
echo "Device Token: $DEVICE_TOKEN"
echo "Bundle ID: $BUNDLE_ID"
echo "Response Time (Unix timestamp): $CURRENT_TIMESTAMP"

# Create a json file for debugging - using null for responseTime which seems safer
# Based on your model definition in LiveActivityModels.swift:
# struct ContentState: Codable, Hashable {
#   var status: String
#   var responseTime: Date?
#   var respondedBy: String?
# }
JSON_PAYLOAD=$(cat <<EOF
{
    "aps": {
        "event": "update",
        "timestamp": $TIMESTAMP,
        "content-state": {
            "status": "approved",
            "responseTime": null,
            "respondedBy": "Principal Johnson"
        }
    },
    "activity-id": "$ACTIVITY_ID"
}
EOF
)

echo "$JSON_PAYLOAD" > payload.json
echo "JSON payload saved to payload.json for verification:"
cat payload.json

echo "Sending Live Activity update notification..."
curl -v \
--header "authorization: Bearer $TOKEN" \
--header "apns-topic: $BUNDLE_ID.push-type.liveactivity" \
--header "apns-push-type: liveactivity" \
--header "apns-priority: 10" \
--header "content-type: application/json" \
--header "apns-development: true" \
--data @payload.json \
--http2 \
https://api.development.push.apple.com/3/device/$DEVICE_TOKEN

echo ""
echo "Live Activity update sent. Check your device." 