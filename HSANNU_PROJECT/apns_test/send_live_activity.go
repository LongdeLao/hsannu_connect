// Package main provides a utility for sending Apple Live Activity updates
package main

import (
	"bytes"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

// Configuration
const (
	APNsHost = "api.push.apple.com" // Use api.push.apple.com for production
	APNsPort = "443"
	KeyPath  = "apns_test/AuthKey.p8" // Path to your .p8 key file
	KeyID    = "your_key_id"          // Your APNs Key ID
	TeamID   = "your_team_id"         // Your Apple Developer Team ID
	BundleID = "com.leo.hsannu"       // Your app's bundle ID
)

// Command line flags
var (
	deviceToken = flag.String("token", "", "APNs device token for the target device")
	activityID  = flag.String("activity", "", "Live Activity ID to update")
	status      = flag.String("status", "approved", "Status (approved, rejected, cancelled, finished)")
	responder   = flag.String("responder", "Staff Member", "Name of the staff member who responded")
)

// ContentState represents the state of a Live Activity
type ContentState struct {
	Status       string    `json:"status"`
	ResponseTime time.Time `json:"responseTime"`
	RespondedBy  string    `json:"respondedBy"`
}

// APS represents the Apple Push Service payload structure
type APS struct {
	Event        string       `json:"event"`
	Timestamp    int64        `json:"timestamp"`
	ContentState ContentState `json:"content-state"`
}

// LiveActivityPayload represents the entire notification payload
type LiveActivityPayload struct {
	APS        APS    `json:"aps"`
	ActivityID string `json:"activity-id"`
}

// JWTClaims represents the JWT claims for Apple authentication
type JWTClaims struct {
	Issuer   string `json:"iss"`
	IssuedAt int64  `json:"iat"`
	KeyID    string `json:"-"` // Not included in claims but used in header
}

// NOTE: Since we don't have a JWT library imported in the project, we'll mock the
// token generation. In a real implementation, you would use a JWT library.
// This is just to illustrate the structure and flow of the code.

// generateMockToken creates a mock token for demonstration purposes
// In a real implementation, you would use a JWT library to create a proper token
func generateMockToken() (string, error) {
	// This would normally be token generation code
	// For demonstration, we'll just return a mock token
	log.Println("⚠️ This is a mock token. In a real implementation, generate a proper JWT token.")
	return "mock.jwt.token", nil
}

// sendNotification sends the APNs request
func sendNotification(jwtToken string, deviceToken string, payload []byte) error {
	// Create the URL
	url := fmt.Sprintf("https://%s:%s/3/device/%s", APNsHost, APNsPort, deviceToken)

	// Create the request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("authorization", "bearer "+jwtToken)
	req.Header.Set("apns-topic", BundleID+".push-type.liveactivity")
	req.Header.Set("apns-push-type", "liveactivity")
	req.Header.Set("apns-priority", "10")
	req.Header.Set("content-type", "application/json")

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// Read the response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %v", err)
	}

	// Check for success
	if resp.StatusCode != 200 {
		return fmt.Errorf("APNs error: %s - %s", resp.Status, string(body))
	}

	fmt.Printf("Response status: %s\n", resp.Status)
	if len(body) > 0 {
		fmt.Printf("Response body: %s\n", string(body))
	}

	return nil
}

// This file serves as a reference implementation.
// In a real Go project, you would add a main() function here to run the code.
