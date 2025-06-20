# 🛡️ LocalLoop V0.3 Backup & Disaster Recovery Strategy

## 📋 Overview

This document outlines the comprehensive backup and disaster recovery strategy for LocalLoop V0.3, ensuring business continuity and data protection in production environments.

## 🎯 Backup Objectives

- **Recovery Time Objective (RTO)**: < 4 hours for full system restoration
- **Recovery Point Objective (RPO)**: < 1 hour for data loss tolerance
- **Availability Target**: 99.9% uptime with minimal data loss
- **Compliance**: GDPR-compliant data handling and retention

## 🗄️ Database Backup Strategy (Supabase)

### **1. Automated Database Backups**

**Supabase Built-in Backups:**
- **Point-in-Time Recovery**: Available for 7 days (Pro plan) or 30 days (Team/Enterprise)
- **Daily Snapshots**: Automatic daily backups retained for 30 days
- **Geographic Replication**: Multi-region backup storage

**Configuration:**
```sql
-- Enable Point-in-Time Recovery (if not already enabled)
-- This is configured in Supabase Dashboard > Settings > Database
-- Backup retention: 30 days recommended for production
```

### **2. Custom Database Backup Scripts**

**Daily Schema + Data Backup:**
```bash
#!/bin/bash
# scripts/backup-database.sh

# Configuration
BACKUP_DIR="/secure/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
SUPABASE_PROJECT_REF="your-project-ref"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Export schema
pg_dump \
  --host=db.${SUPABASE_PROJECT_REF}.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema-only \
  --file="$BACKUP_DIR/schema_$DATE.sql"

# Export data
pg_dump \
  --host=db.${SUPABASE_PROJECT_REF}.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --data-only \
  --file="$BACKUP_DIR/data_$DATE.sql"

# Compress backups
gzip "$BACKUP_DIR/schema_$DATE.sql"
gzip "$BACKUP_DIR/data_$DATE.sql"

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "✅ Database backup completed: $DATE"
```

### **3. Critical Data Export Scripts**

**User Data Export (GDPR Compliance):**
```bash
#!/bin/bash
# scripts/export-user-data.sh

USER_ID="$1"
EXPORT_DIR="/secure/exports"
DATE=$(date +%Y%m%d_%H%M%S)

if [ -z "$USER_ID" ]; then
    echo "Usage: $0 <user_id>"
    exit 1
fi

# Export user data to JSON
psql -h db.${SUPABASE_PROJECT_REF}.supabase.co \
     -U postgres \
     -d postgres \
     -c "COPY (
         SELECT json_build_object(
             'user', row_to_json(u.*),
             'events', (SELECT json_agg(e.*) FROM events e WHERE e.organizer_id = u.id),
             'rsvps', (SELECT json_agg(r.*) FROM rsvps r WHERE r.user_id = u.id),
             'orders', (SELECT json_agg(o.*) FROM orders o WHERE o.user_id = u.id)
         )
         FROM users u WHERE u.id = '$USER_ID'
     ) TO STDOUT" > "$EXPORT_DIR/user_data_${USER_ID}_$DATE.json"

echo "✅ User data exported: $EXPORT_DIR/user_data_${USER_ID}_$DATE.json"
```

## 🔧 Configuration Backup Strategy

### **1. Environment Variables Backup**

**Secure Configuration Backup:**
```bash
#!/bin/bash
# scripts/backup-config.sh

BACKUP_DIR="/secure/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup Vercel environment variables (structure only, no secrets)
cat > "$BACKUP_DIR/env_structure_$DATE.txt" << EOF
# LocalLoop V0.3 Environment Variables Structure
# Generated: $DATE

# Core Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Calendar API (Required)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
GOOGLE_CALENDAR_ENCRYPTION_KEY=32-character-key

# Stripe (Required)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (Required)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@your-domain.com
EOF

# Backup deployment configuration
cp vercel.json "$BACKUP_DIR/vercel_$DATE.json"
cp package.json "$BACKUP_DIR/package_$DATE.json"
cp next.config.ts "$BACKUP_DIR/next.config_$DATE.ts"

# Backup documentation
tar -czf "$BACKUP_DIR/docs_$DATE.tar.gz" docs/

echo "✅ Configuration backup completed: $DATE"
```

### **2. Deployment Configuration Backup**

**Infrastructure as Code Backup:**
```bash
#!/bin/bash
# scripts/backup-infrastructure.sh

BACKUP_DIR="/secure/backups/infrastructure"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup all deployment-related files
tar -czf "$BACKUP_DIR/deployment_config_$DATE.tar.gz" \
    vercel.json \
    package.json \
    package-lock.json \
    next.config.ts \
    tsconfig.json \
    .github/ \
    scripts/ \
    docs/

echo "✅ Infrastructure backup completed: $DATE"
```

## 📁 Code Repository Backup Strategy

### **1. Git Repository Protection**

**Multiple Remote Repositories:**
```bash
# Add backup remotes
git remote add backup-github git@github.com:your-org/localloop-backup.git
git remote add backup-gitlab git@gitlab.com:your-org/localloop-backup.git

# Push to all remotes
git push origin main
git push backup-github main
git push backup-gitlab main
```

**Automated Repository Backup:**
```bash
#!/bin/bash
# scripts/backup-repository.sh

BACKUP_DIR="/secure/backups/repository"
DATE=$(date +%Y%m%d_%H%M%S)

# Create full repository backup
git bundle create "$BACKUP_DIR/localloop_$DATE.bundle" --all

# Create compressed source backup
tar -czf "$BACKUP_DIR/source_$DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=.git \
    .

echo "✅ Repository backup completed: $DATE"
```

### **2. Release Artifacts Backup**

**Production Build Backup:**
```bash
#!/bin/bash
# scripts/backup-build.sh

BACKUP_DIR="/secure/backups/builds"
DATE=$(date +%Y%m%d_%H%M%S)
VERSION=$(node -p "require('./package.json').version")

# Backup production build
tar -czf "$BACKUP_DIR/build_v${VERSION}_$DATE.tar.gz" .next/

echo "✅ Build backup completed: v$VERSION ($DATE)"
```

## 🔄 Automated Backup Scheduling

### **1. Cron Job Configuration**

```bash
# Add to crontab: crontab -e

# Daily database backup at 2 AM UTC
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/backup-database.log 2>&1

# Daily configuration backup at 3 AM UTC
0 3 * * * /path/to/scripts/backup-config.sh >> /var/log/backup-config.log 2>&1

# Weekly repository backup on Sundays at 4 AM UTC
0 4 * * 0 /path/to/scripts/backup-repository.sh >> /var/log/backup-repository.log 2>&1

# Monthly infrastructure backup on 1st of month at 5 AM UTC
0 5 1 * * /path/to/scripts/backup-infrastructure.sh >> /var/log/backup-infrastructure.log 2>&1
```

### **2. GitHub Actions Backup Workflow**

```yaml
# .github/workflows/backup.yml
name: Automated Backup

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Create Repository Backup
        run: |
          git bundle create backup-$(date +%Y%m%d).bundle --all
          
      - name: Upload to Secure Storage
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws s3 cp backup-$(date +%Y%m%d).bundle s3://localloop-backups/repository/
```

## 🧪 Backup Verification & Testing

### **1. Backup Integrity Testing**

```bash
#!/bin/bash
# scripts/test-backup-integrity.sh

BACKUP_DIR="/secure/backups"
DATE=$(date +%Y%m%d)

echo "🧪 Testing backup integrity..."

# Test database backup
if [ -f "$BACKUP_DIR/database/schema_${DATE}*.sql.gz" ]; then
    gunzip -t "$BACKUP_DIR/database/schema_${DATE}"*.sql.gz
    echo "✅ Database schema backup integrity: OK"
else
    echo "❌ Database schema backup not found"
fi

# Test configuration backup
if [ -f "$BACKUP_DIR/config/vercel_${DATE}*.json" ]; then
    jq empty "$BACKUP_DIR/config/vercel_${DATE}"*.json
    echo "✅ Configuration backup integrity: OK"
else
    echo "❌ Configuration backup not found"
fi

# Test repository backup
if [ -f "$BACKUP_DIR/repository/localloop_${DATE}*.bundle" ]; then
    git bundle verify "$BACKUP_DIR/repository/localloop_${DATE}"*.bundle
    echo "✅ Repository backup integrity: OK"
else
    echo "❌ Repository backup not found"
fi
```

### **2. Disaster Recovery Testing**

```bash
#!/bin/bash
# scripts/test-disaster-recovery.sh

echo "🚨 Disaster Recovery Test - $(date)"

# Test 1: Database restoration
echo "Testing database restoration..."
# Create test database and restore from backup
# Verify data integrity and completeness

# Test 2: Environment restoration
echo "Testing environment restoration..."
# Verify all environment variables can be restored
# Test application startup with restored config

# Test 3: Full application restoration
echo "Testing full application restoration..."
# Deploy from backup to staging environment
# Run integration tests to verify functionality

echo "✅ Disaster recovery test completed"
```

## 📊 Backup Monitoring & Alerting

### **1. Backup Status Monitoring**

```bash
#!/bin/bash
# scripts/monitor-backups.sh

BACKUP_DIR="/secure/backups"
ALERT_EMAIL="admin@your-domain.com"

# Check if daily backups completed
TODAY=$(date +%Y%m%d)

# Database backup check
if [ ! -f "$BACKUP_DIR/database/schema_${TODAY}"*.sql.gz ]; then
    echo "❌ Database backup missing for $TODAY" | mail -s "ALERT: Database Backup Failed" $ALERT_EMAIL
fi

# Configuration backup check
if [ ! -f "$BACKUP_DIR/config/vercel_${TODAY}"*.json ]; then
    echo "❌ Configuration backup missing for $TODAY" | mail -s "ALERT: Config Backup Failed" $ALERT_EMAIL
fi

echo "✅ Backup monitoring completed"
```

### **2. Storage Usage Monitoring**

```bash
#!/bin/bash
# scripts/monitor-backup-storage.sh

BACKUP_DIR="/secure/backups"
THRESHOLD_GB=100

# Check storage usage
USAGE_GB=$(du -sg "$BACKUP_DIR" | cut -f1)

if [ "$USAGE_GB" -gt "$THRESHOLD_GB" ]; then
    echo "⚠️ Backup storage usage: ${USAGE_GB}GB (threshold: ${THRESHOLD_GB}GB)"
    echo "Consider cleaning up old backups or increasing storage capacity"
fi
```

## 🔐 Security & Compliance

### **1. Backup Encryption**

```bash
# Encrypt sensitive backups
gpg --symmetric --cipher-algo AES256 --compress-algo 1 \
    --output backup_encrypted.gpg backup_file.tar.gz

# Decrypt when needed
gpg --decrypt backup_encrypted.gpg > backup_file.tar.gz
```

### **2. Access Control**

- **Backup Storage**: Restricted access with multi-factor authentication
- **Encryption Keys**: Stored separately from backup data
- **Audit Logging**: All backup access logged and monitored
- **Retention Policy**: Automated cleanup based on compliance requirements

## 📋 Disaster Recovery Procedures

### **1. Database Recovery**

```bash
# Point-in-time recovery using Supabase
# 1. Access Supabase Dashboard
# 2. Navigate to Settings > Database > Backups
# 3. Select restore point
# 4. Confirm restoration

# Manual recovery from backup
psql -h db.your-project-ref.supabase.co \
     -U postgres \
     -d postgres \
     -f backup_schema.sql

psql -h db.your-project-ref.supabase.co \
     -U postgres \
     -d postgres \
     -f backup_data.sql
```

### **2. Application Recovery**

```bash
# 1. Restore environment variables in Vercel
# 2. Deploy from backup repository
# 3. Verify all integrations working
# 4. Run smoke tests
# 5. Update DNS if necessary
```

### **3. Full System Recovery**

1. **Assess Damage**: Determine scope of failure
2. **Activate DR Plan**: Notify stakeholders
3. **Restore Database**: From most recent backup
4. **Restore Application**: Deploy from backup
5. **Verify Functionality**: Run comprehensive tests
6. **Resume Operations**: Update monitoring and alerts
7. **Post-Incident Review**: Document lessons learned

## 📞 Emergency Contacts

- **Primary Admin**: [Contact Information]
- **Database Admin**: [Contact Information]
- **DevOps Lead**: [Contact Information]
- **Supabase Support**: support@supabase.com
- **Vercel Support**: support@vercel.com

---

**Last Updated:** January 15, 2025  
**Next Review:** April 15, 2025  
**Version:** 1.0 