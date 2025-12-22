#!/bin/bash

# Create deployment directory
DEPLOY_DIR="hsannu_connect_deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

echo "Preparing Next.js deployment package..."

# Copy essential files for Next.js production
cp -r .next "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/"
cp -r src "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp next.config.ts "$DEPLOY_DIR/"
cp tsconfig.json "$DEPLOY_DIR/"
cp postcss.config.mjs "$DEPLOY_DIR/"
cp components.json "$DEPLOY_DIR/"
cp next-env.d.ts "$DEPLOY_DIR/"

# Create production start script
cat > "$DEPLOY_DIR/start.sh" << 'EOF'
#!/bin/bash
# Production start script for hsannu_connect

# Install dependencies (production only)
npm ci --only=production

# Start the Next.js application
npm start
EOF

chmod +x "$DEPLOY_DIR/start.sh"

# Create PM2 ecosystem file for production deployment
cat > "$DEPLOY_DIR/ecosystem.config.js" << 'EOF'
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
      PORT: 3000
    }
  }]
}
EOF

echo "Deployment package created in $DEPLOY_DIR/"
echo "Package contents:"
ls -la "$DEPLOY_DIR/"
