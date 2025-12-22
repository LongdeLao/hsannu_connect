#!/bin/bash

# HSANNU Connect - Deploy Nginx Configuration
# This script deploys the nginx configuration to fix document-files 502 errors

set -e

# Configuration
SERVER_HOST="connect.hsannu.com"
SERVER_USER="root"
NGINX_CONFIG="nginx-config"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available/default"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${GREEN}"
    echo "========================================"
    echo "   HSANNU Connect - Nginx Config Deploy"
    echo "========================================"
    echo -e "${NC}"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v ssh &> /dev/null; then
        log_error "SSH is required but not installed"
        exit 1
    fi
    
    if [ ! -f "$NGINX_CONFIG" ]; then
        log_error "Nginx configuration file '$NGINX_CONFIG' not found"
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

test_server_connection() {
    log_info "Testing server connection..."
    
    if ! ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'Connection successful'" > /dev/null 2>&1; then
        log_error "Cannot connect to server $SERVER_USER@$SERVER_HOST"
        log_error "Please ensure SSH access is configured"
        exit 1
    fi
    
    log_success "Server connection verified"
}

backup_current_config() {
    log_info "Backing up current nginx configuration..."
    
    ssh $SERVER_USER@$SERVER_HOST "
        if [ -f '$NGINX_SITES_AVAILABLE' ]; then
            cp '$NGINX_SITES_AVAILABLE' '${NGINX_SITES_AVAILABLE}.backup.\$(date +%Y%m%d_%H%M%S)'
            echo 'Current configuration backed up'
        else
            echo 'No existing configuration found to backup'
        fi
    "
    
    log_success "Configuration backup completed"
}

deploy_nginx_config() {
    log_info "Deploying new nginx configuration..."
    
    # Upload the new configuration
    scp "$NGINX_CONFIG" $SERVER_USER@$SERVER_HOST:/tmp/nginx-config-new
    
    # Install the configuration
    ssh $SERVER_USER@$SERVER_HOST "
        set -e
        
        echo 'Installing new nginx configuration...'
        cp /tmp/nginx-config-new '$NGINX_SITES_AVAILABLE'
        
        echo 'Setting correct permissions...'
        chmod 644 '$NGINX_SITES_AVAILABLE'
        chown root:root '$NGINX_SITES_AVAILABLE'
        
        echo 'Ensuring sites-enabled symlink...'
        if [ ! -L '/etc/nginx/sites-enabled/default' ]; then
            rm -f /etc/nginx/sites-enabled/default
            ln -s '$NGINX_SITES_AVAILABLE' /etc/nginx/sites-enabled/default
        fi
        
        echo 'Testing nginx configuration...'
        nginx -t
        
        echo 'Reloading nginx...'
        systemctl reload nginx
        
        echo 'Cleaning up temporary file...'
        rm -f /tmp/nginx-config-new
        
        echo 'Nginx configuration deployed successfully'
    "
    
    log_success "Nginx configuration deployed and reloaded"
}

verify_fix() {
    log_info "Verifying the fix..."
    
    # Wait a moment for nginx to fully reload
    sleep 2
    
    # Test document-files endpoint
    log_info "Testing document-files endpoint..."
    if curl -I "https://$SERVER_HOST/document-files/" 2>/dev/null | grep -q "HTTP/1.1 200\|HTTP/2 200"; then
        log_success "✅ Document-files endpoint is now working!"
    elif curl -I "https://$SERVER_HOST/document-files/" 2>/dev/null | grep -q "HTTP/1.1 404\|HTTP/2 404"; then
        log_success "✅ Document-files endpoint is accessible (404 is expected for empty path)"
    else
        log_error "❌ Document-files endpoint still returning errors"
        echo "Manual check required. Try accessing: https://$SERVER_HOST/document-files/"
    fi
    
    # Test API endpoint
    log_info "Testing API endpoint..."
    if curl -f "https://$SERVER_HOST/api/documents/static" > /dev/null 2>&1; then
        log_success "✅ API endpoint is working"
    else
        log_error "❌ API endpoint has issues"
    fi
    
    # Test student formal images endpoint
    log_info "Testing student formal images endpoint..."
    if curl -I "https://$SERVER_HOST/api/student_formal_images/" 2>/dev/null | grep -q "HTTP/1.1 404\|HTTP/2 404\|HTTP/1.1 200\|HTTP/2 200"; then
        log_success "✅ Student formal images endpoint is accessible (Go backend responding)"
    else
        log_error "❌ Student formal images endpoint still routing to Next.js"
        echo "Manual check required. Try: curl -I https://$SERVER_HOST/api/student_formal_images/1422.jpg"
    fi
    
    # Test main site
    log_info "Testing main site..."
    if curl -f "https://$SERVER_HOST" > /dev/null 2>&1; then
        log_success "✅ Main site is accessible"
    else
        log_error "❌ Main site has issues"
    fi
}

main() {
    print_header
    
    log_info "This script will fix the 502 Bad Gateway error for document files and student images"
    log_info "by updating the nginx configuration to properly proxy /document-files/ and /api/student_formal_images/ requests"
    echo ""
    
    # Checks
    check_dependencies
    test_server_connection
    
    # Deployment
    backup_current_config
    deploy_nginx_config
    
    # Verification
    verify_fix
    
    # Success
    echo ""
    echo -e "${GREEN}"
    echo "========================================"
    echo "   🎉 NGINX CONFIG DEPLOYED! 🎉"
    echo "========================================"
    echo "The 502 Bad Gateway error for document files and student images should now be fixed!"
    echo "Document URLs like /document-files/... and student images like /api/student_formal_images/... will now properly proxy to the Go backend."
    echo -e "${NC}"
    
    log_info "To test manually:"
    echo "  Try accessing any document from the documents page"
    echo "  Or test: curl -I https://$SERVER_HOST/document-files/"
}

# Show help
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    echo "HSANNU Connect - Deploy Nginx Configuration"
    echo ""
    echo "This script fixes the 502 Bad Gateway error for document files and student images by"
    echo "updating the nginx configuration to properly proxy /document-files/ and /api/student_formal_images/ requests"
    echo "to the Go backend server running on port 2000."
    echo ""
    echo "Usage: $0"
    echo ""
    echo "Requirements:"
    echo "  - SSH access to $SERVER_USER@$SERVER_HOST"
    echo "  - nginx-config file in current directory"
    echo "  - sudo/root access on the server"
    exit 0
fi

# Run main function
main 
 