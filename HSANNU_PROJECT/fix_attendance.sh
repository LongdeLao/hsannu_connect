#!/bin/bash

# Script to fix mismatches between attendance and attendance_history tables
# This script can be run whenever you notice issues with marking late students as arrived

echo "🔄 Fixing attendance table sync issues..."

# Define database connection parameters
DB_HOST="69.62.73.139"
DB_PORT="5433"
DB_NAME="HSANNU"
DB_USER="postgres"

# Prompt for database password
echo -n "Enter database password for $DB_USER: "
read -s DB_PASS
echo ""

# Run the SQL fix script
echo "🔄 Running SQL fix script..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f fix_attendance_sync.sql

echo "✅ Attendance sync completed!" 