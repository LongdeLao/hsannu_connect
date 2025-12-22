package main

import (
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
)

func main() {
	keyBytes, err := os.ReadFile("key.p8")
	if err != nil {
		fmt.Printf("Error reading key file: %v\n", err)
		return
	}

	block, _ := pem.Decode(keyBytes)
	if block == nil {
		fmt.Println("Failed to parse PEM block")
		return
	}

	privateKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		fmt.Printf("Error parsing private key: %v\n", err)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodES256, jwt.MapClaims{
		"iss": "CNSN2FZNRR",
		"iat": time.Now().Unix(),
	})

	// Add your Key ID here
	token.Header["kid"] = "BK88TAV8F8"

	ecdsaKey, ok := privateKey.(*ecdsa.PrivateKey)
	if !ok {
		fmt.Println("Failed to cast private key")
		return
	}

	tokenString, err := token.SignedString(ecdsaKey)
	if err != nil {
		fmt.Printf("Error signing token: %v\n", err)
		return
	}

	fmt.Printf("%s\n", tokenString)
}
