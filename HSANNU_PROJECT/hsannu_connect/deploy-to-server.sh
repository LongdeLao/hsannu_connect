#!/bin/bash

# HSANNU Connect - Next.js Deployment Script
# This script automates the complete deployment process to the production server

set -e  # Exit on any error

# ============================================================================
# CONFIGURATION
# ============================================================================
SERVER_USER="root"
SERVER_HOST="69.62.73.139"
SERVER_PATH="/var/www/html"
APP_NAME="hsannu_connect"
LOCAL_BUILD_DIR="hsannu_connect_deploy"
BACKUP_DIR="backups"
# Inserted: password and SSH options for non-interactive auth
SERVER_PASSWORD='g4w3gbzb7#A3'
SSH_BASE_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

print_header() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "  HSANNU Connect Deployment Script"
    echo "========================================"
    echo -e "${NC}"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
    fi
    
    if ! command -v ssh &> /dev/null; then
        log_error "ssh is not installed"
    fi
    
    if ! command -v scp &> /dev/null; then
        log_error "scp is not installed"
    fi
	
	# Ensure sshpass is available for non-interactive SSH/SCP
	if ! command -v sshpass &> /dev/null; then
		log_warning "sshpass is not installed; attempting to install..."
		if command -v brew &> /dev/null; then
			# Homebrew (macOS) - install via tap since sshpass is not in core
			if ! brew list sshpass >/dev/null 2>&1; then
				brew install hudochenkov/sshpass/sshpass || log_error "Failed to install sshpass via Homebrew. Install it manually and re-run."
			fi
		elif command -v apt-get &> /dev/null; then
			# Debian/Ubuntu
			sudo apt-get update -y && sudo apt-get install -y sshpass || log_error "Failed to install sshpass with apt-get."
		elif command -v yum &> /dev/null; then
			# RHEL/CentOS
			sudo yum install -y epel-release && sudo yum install -y sshpass || log_error "Failed to install sshpass with yum."
		else
			log_error "sshpass is required but could not be installed automatically. Please install sshpass and rerun."
		fi
	fi
    
    log_success "All dependencies are available"
}

test_server_connection() {
    log_info "Testing server connection..."
	if sshpass -p "$SERVER_PASSWORD" ssh $SSH_BASE_OPTS -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'Connection successful'" >/dev/null 2>&1; then
		log_success "Server connection test passed"
    else
		log_error "Cannot connect to server with provided credentials."
    fi
}

# ============================================================================
# BUILD FUNCTIONS
# ============================================================================
clean_previous_build() {
    log_info "Cleaning previous build..."
    rm -rf "$LOCAL_BUILD_DIR"
    rm -f "${LOCAL_BUILD_DIR}.tar.gz"
    log_success "Cleanup completed"
}

build_application() {
    log_info "Building Next.js application..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    # Build the application
    log_info "Running production build..."
    npm run build
    
    log_success "Application build completed"
}

create_deployment_package() {
    log_info "Creating deployment package..."
    
    mkdir -p "$LOCAL_BUILD_DIR"
    
    # Copy essential files for Next.js production
    cp -r .next "$LOCAL_BUILD_DIR/"
    cp -r public "$LOCAL_BUILD_DIR/"
    cp -r src "$LOCAL_BUILD_DIR/"
    cp package.json "$LOCAL_BUILD_DIR/"
    cp package-lock.json "$LOCAL_BUILD_DIR/"
    cp next.config.ts "$LOCAL_BUILD_DIR/"
    cp tsconfig.json "$LOCAL_BUILD_DIR/"
    
    # Copy optional files if they exist
    [ -f "postcss.config.mjs" ] && cp postcss.config.mjs "$LOCAL_BUILD_DIR/"
    [ -f "components.json" ] && cp components.json "$LOCAL_BUILD_DIR/"
    [ -f "next-env.d.ts" ] && cp next-env.d.ts "$LOCAL_BUILD_DIR/"
    [ -f "tailwind.config.js" ] && cp tailwind.config.js "$LOCAL_BUILD_DIR/"
    [ -f "tailwind.config.ts" ] && cp tailwind.config.ts "$LOCAL_BUILD_DIR/"

    # Create production start script
    cat > "$LOCAL_BUILD_DIR/start.sh" << 'EOF'
#!/bin/bash
# Production start script for hsannu_connect

echo "Starting HSANNU Connect application..."

# Install production dependencies
echo "Installing dependencies..."
npm ci --omit=dev --silent

# Start the Next.js application
echo "Starting Next.js server..."
exec npm start
EOF

    chmod +x "$LOCAL_BUILD_DIR/start.sh"

    # Create PM2 ecosystem file
    cat > "$LOCAL_BUILD_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'hsannu_connect',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    }
  }]
}
EOF

    # Create compressed archive
    log_info "Creating compressed archive..."
    tar -czf "${LOCAL_BUILD_DIR}.tar.gz" "$LOCAL_BUILD_DIR/"
    
    log_success "Deployment package created: ${LOCAL_BUILD_DIR}.tar.gz"
    log_info "Package size: $(du -h "${LOCAL_BUILD_DIR}.tar.gz" | cut -f1)"
}

# ============================================================================
# DEPLOYMENT FUNCTIONS
# ============================================================================
backup_current_deployment() {
    log_info "Creating backup of current deployment..."
    
	sshpass -p "$SERVER_PASSWORD" ssh $SSH_BASE_OPTS $SERVER_USER@$SERVER_HOST "
        if [ -d '$SERVER_PATH/$LOCAL_BUILD_DIR' ]; then
            mkdir -p '$SERVER_PATH/$BACKUP_DIR'
            backup_name=\"${APP_NAME}_backup_\$(date +%Y%m%d_%H%M%S)\"
            mv '$SERVER_PATH/$LOCAL_BUILD_DIR' '$SERVER_PATH/$BACKUP_DIR/\$backup_name'
            echo 'Backup created: \$backup_name'
        else
            echo 'No existing deployment to backup'
        fi
    "
    
    log_success "Backup completed"
}

upload_to_server() {
    log_info "Uploading deployment package to server..."
    
	sshpass -p "$SERVER_PASSWORD" scp $SSH_BASE_OPTS "${LOCAL_BUILD_DIR}.tar.gz" $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
    
    log_success "Upload completed"
}

deploy_on_server() {
    log_info "Deploying application on server..."
    
	sshpass -p "$SERVER_PASSWORD" ssh $SSH_BASE_OPTS $SERVER_USER@$SERVER_HOST "
        set -e
        cd '$SERVER_PATH'
        
        echo 'Extracting deployment package...'
        tar -xzf '${LOCAL_BUILD_DIR}.tar.gz'
        
        echo 'Setting up application directory...'
        cd '$LOCAL_BUILD_DIR'
        
        echo 'Installing production dependencies...'
        npm ci --omit=dev --silent
        
        echo 'Setting correct permissions...'
        chown -R www-data:www-data '$SERVER_PATH/$LOCAL_BUILD_DIR' || echo 'Warning: Could not change ownership to www-data'
        
        echo 'Deployment files prepared successfully'
    "
    
    log_success "Server deployment completed"
}

manage_pm2_process() {
    log_info "Managing PM2 process..."
    
	sshpass -p "$SERVER_PASSWORD" ssh $SSH_BASE_OPTS $SERVER_USER@$SERVER_HOST "
        cd '$SERVER_PATH/$LOCAL_BUILD_DIR'
        
        # Stop existing process if running
        if pm2 describe $APP_NAME > /dev/null 2>&1; then
            echo 'Stopping existing PM2 process...'
            pm2 stop $APP_NAME
            pm2 delete $APP_NAME
        fi
        
        echo 'Starting new PM2 process...'
        pm2 start ecosystem.config.js
        
        echo 'Saving PM2 configuration...'
        pm2 save
        
        echo 'Process management completed'
    "
    
    log_success "PM2 process management completed"
}

# update_nginx_config removed per request to avoid modifying nginx config


cleanup_server() {
    log_info "Cleaning up server..."
    
	sshpass -p "$SERVER_PASSWORD" ssh $SSH_BASE_OPTS $SERVER_USER@$SERVER_HOST "
        cd '$SERVER_PATH'
        rm -f '${LOCAL_BUILD_DIR}.tar.gz'
        
        # Clean up old backups (keep only last 5)
        if [ -d '$BACKUP_DIR' ]; then
            cd '$BACKUP_DIR'
            ls -t ${APP_NAME}_backup_* 2>/dev/null | tail -n +6 | xargs rm -rf
        fi
        
        echo 'Server cleanup completed'
    "
    
    log_success "Server cleanup completed"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check PM2 status
	sshpass -p "$SERVER_PASSWORD" ssh $SSH_BASE_OPTS $SERVER_USER@$SERVER_HOST "
        echo 'PM2 Status:'
        pm2 status $APP_NAME
        
        echo ''
        echo 'Application Health Check:'
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo '✅ Application is responding on port 3000'
        else
            echo '❌ Application is not responding on port 3000'
            exit 1
        fi
        
        echo ''
		echo 'Nginx Status (skipped check by request):'
        if systemctl is-active --quiet nginx; then
			echo 'ℹ️ Nginx is running'
        else
			echo 'ℹ️ Nginx is not running'
        fi
    "
    
    log_success "Deployment verification completed"
}

# ============================================================================
# MAIN DEPLOYMENT FLOW
# ============================================================================
main() {
    print_header
    
    # Pre-flight checks
    check_dependencies
    test_server_connection
    
    # Build phase
    log_info "Starting build phase..."
    clean_previous_build
    build_application
    create_deployment_package
    
    # Deployment phase  
    log_info "Starting deployment phase..."
    backup_current_deployment
    upload_to_server
    deploy_on_server
    manage_pm2_process
    cleanup_server
    
    # Verification
    verify_deployment
    
    # Cleanup local files
    log_info "Cleaning up local build files..."
    rm -rf "$LOCAL_BUILD_DIR"
    rm -f "${LOCAL_BUILD_DIR}.tar.gz"
    
    # Success message
    echo -e "${GREEN}"
    echo "========================================"
    echo "   🎉 DEPLOYMENT SUCCESSFUL! 🎉"
    echo "========================================"
    echo "Application URL: https://connect.hsannu.com"
    echo "Deployment completed at: $(date)"
    echo -e "${NC}"
    
    log_info "To monitor the application:"
    echo "  ssh $SERVER_USER@$SERVER_HOST 'pm2 status'"
    echo "  ssh $SERVER_USER@$SERVER_HOST 'pm2 logs $APP_NAME'"
}

# ============================================================================
# SCRIPT EXECUTION
# ============================================================================

# Help function
show_help() {
    echo "HSANNU Connect Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --dry-run      Show what would be done without executing"
    echo ""
    echo "This script will:"
    echo "  1. Build the Next.js application"
    echo "  2. Create a deployment package"
    echo "  3. Upload to the production server"
    echo "  4. Deploy and start the application with PM2"
    echo "  5. Verify the deployment"
    echo ""
    echo "Requirements:"
    echo "  - SSH access to $SERVER_USER@$SERVER_HOST"
    echo "  - Node.js and npm installed locally"
    echo "  - PM2 installed on the server"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --dry-run)
        log_info "DRY RUN MODE - No changes will be made"
        log_info "Would execute full deployment process..."
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
