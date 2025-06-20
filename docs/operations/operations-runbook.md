# 🚀 LocalLoop Operations Runbook

## 📋 Overview

This runbook provides comprehensive procedures for operating and maintaining LocalLoop in production. It covers routine maintenance, common operational tasks, monitoring, and emergency procedures.

**Target Audience**: DevOps engineers, system administrators, and on-call personnel
**Environment**: Production LocalLoop deployment on Vercel with Supabase backend

---

## 🎯 Quick Reference

### **Emergency Contacts**
- **Technical Lead**: [Contact Information]
- **Product Owner**: [Contact Information]  
- **On-Call Rotation**: [PagerDuty/Oncall System]

### **Critical Systems**
- **Frontend**: Vercel deployment (https://localloop.com)
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe integration
- **Email**: Resend service
- **Calendar**: Google Calendar API
- **Monitoring**: Built-in analytics dashboard

### **Dashboard URLs**
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com/projects
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Google Cloud Console**: https://console.cloud.google.com

---

## 🔄 Daily Operations

### **Daily Health Checks (5-10 minutes)**

#### **1. System Status Verification**
```bash
# Check application status
curl -f https://localloop.com/api/health || echo "ALERT: Health check failed"

# Verify database connectivity
curl -f https://localloop.com/api/admin/system-status || echo "ALERT: Database connectivity issue"

# Check recent error logs in Vercel dashboard
# Navigate to Vercel → LocalLoop → Functions → View logs
```

#### **2. Key Metrics Review**
- **Response Times**: < 2 seconds for critical pages
- **Error Rate**: < 1% of total requests
- **Uptime**: 99.9% target
- **Database Queries**: Average < 100ms

#### **3. User Activity Monitoring**
```bash
# Check for recent registrations and events
# Access: LocalLoop Admin Dashboard → Analytics

# Verify payment processing
# Access: Stripe Dashboard → Payments (check last 24h)

# Email delivery status  
# Access: Resend Dashboard → Activity Log
```

### **Weekly Maintenance Tasks (30-45 minutes)**

#### **1. Database Maintenance (Mondays)**
```sql
-- Connect to Supabase SQL Editor

-- Check database size and growth
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for long-running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Check index usage
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation 
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;
```

#### **2. Performance Review (Tuesdays)**
- Review Core Web Vitals in production
- Check Lighthouse scores for critical pages
- Analyze slow query reports
- Review and optimize high-traffic endpoints

#### **3. Security Audit (Wednesdays)**
- Review failed authentication attempts
- Check for suspicious API usage patterns  
- Verify SSL certificate status
- Review environment variable security

#### **4. Backup Verification (Thursdays)**
```bash
# Test backup script execution
./scripts/ops/master-backup.sh

# Verify backup integrity
./scripts/ops/verify-backup.sh [latest-backup-file]

# Test restore procedure (in staging)
./scripts/ops/restore-backup.sh [backup-file] staging
```

#### **5. Monitoring & Alerts Review (Fridays)**
- Review alert thresholds and accuracy
- Update on-call rotation if needed
- Check monitoring dashboard functionality
- Test notification channels

---

## 🚨 Common Operational Tasks

### **1. User Account Management**

#### **Reset User Password**
```sql
-- In Supabase SQL Editor
UPDATE auth.users 
SET encrypted_password = crypt('temporary_password', gen_salt('bf'))
WHERE email = 'user@example.com';

-- Notify user to change password on next login
```

#### **Suspend User Account**
```sql
-- Temporarily disable user account
UPDATE auth.users 
SET banned_until = NOW() + INTERVAL '7 days'
WHERE email = 'user@example.com';

-- Re-enable account
UPDATE auth.users 
SET banned_until = NULL
WHERE email = 'user@example.com';
```

#### **Refund Event Ticket**
```bash
# Process refund through admin interface
# 1. Access LocalLoop Admin → Orders Management
# 2. Search for order by email/ticket ID
# 3. Select order → Process Refund
# 4. Verify refund appears in Stripe dashboard
# 5. Confirm refund email sent to customer
```

### **2. Event Management**

#### **Emergency Event Cancellation**
```bash
# 1. Access LocalLoop Admin → Events
# 2. Select event → Actions → Cancel Event
# 3. System will automatically:
#    - Send cancellation emails to all attendees
#    - Process automatic refunds
#    - Update Google Calendar
#    - Update event status

# Manual verification steps:
# 4. Check Stripe for refund processing
# 5. Verify calendar updates
# 6. Monitor email delivery logs
```

#### **Bulk Attendee Communication**
```bash
# 1. Access LocalLoop Admin → Events → [Event Name]
# 2. Navigate to Attendees tab
# 3. Select attendees (or Select All)
# 4. Choose "Send Message" → Compose message
# 5. Preview and send
# 6. Monitor delivery in Resend dashboard
```

### **3. System Configuration**

#### **Update Environment Variables**
```bash
# Production environment variables
# Access: Vercel Dashboard → LocalLoop → Settings → Environment Variables

# Update process:
# 1. Add new variable with new value
# 2. Deploy to staging for testing
# 3. Test thoroughly in staging
# 4. Deploy to production
# 5. Remove old variable
# 6. Verify application functionality
```

#### **Deploy Emergency Hotfix**
```bash
# Emergency deployment process
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/emergency-fix-description

# Make necessary changes
# ... code changes ...

# Commit changes
git add .
git commit -m "hotfix: Emergency fix for [issue description]"

# Push and create PR
git push origin hotfix/emergency-fix-description

# Emergency deployment (skip normal review for critical issues):
git checkout main
git merge hotfix/emergency-fix-description
git push origin main

# Vercel auto-deploys from main branch
# Monitor deployment in Vercel dashboard
```

---

## 📊 Monitoring & Alerting

### **Key Performance Indicators (KPIs)**

#### **Application Performance**
- **Response Time**: P95 < 2 seconds
- **Error Rate**: < 0.5% of requests  
- **Uptime**: 99.9% monthly target
- **Database Queries**: Average < 50ms

#### **Business Metrics**
- **Event Creation Rate**: Weekly trend
- **Ticket Sales**: Daily/weekly revenue
- **User Registration**: New user growth
- **Email Delivery Rate**: > 98% success

#### **System Resources**
- **Database Connections**: < 80% of limit
- **Memory Usage**: < 85% of allocated
- **Storage Growth**: Monitor monthly trends
- **API Rate Limits**: < 80% of limits

### **Alert Thresholds**

#### **Critical Alerts (Immediate Response)**
```yaml
# Application Down
- Health check fails: > 2 consecutive failures
- Error rate: > 5% for 5+ minutes
- Response time: P95 > 10 seconds for 5+ minutes

# Database Issues  
- Connection failures: > 3 in 5 minutes
- Query timeout: > 10 queries timeout in 5 minutes
- Disk space: > 90% full

# Security
- Failed auth attempts: > 100 in 5 minutes from single IP
- Suspicious API usage: > 1000 requests/minute from single source
```

#### **Warning Alerts (Review within 4 hours)**
```yaml
# Performance Degradation
- Response time: P95 > 5 seconds for 15+ minutes  
- Error rate: > 2% for 15+ minutes
- Database queries: Average > 200ms for 15+ minutes

# Resource Usage
- Database connections: > 80% for 30+ minutes
- Memory usage: > 90% for 30+ minutes
- Disk space: > 85% full

# Business Metrics
- Email delivery rate: < 95% for 1+ hour
- Payment failures: > 5% for 1+ hour
```

### **Monitoring Dashboard Setup**

#### **Application Health Dashboard**
```bash
# Access built-in analytics dashboard
https://localloop.com/admin/analytics

# Key widgets to monitor:
# - Real-time user activity
# - Response time trends
# - Error rate graphs  
# - Database performance metrics
# - Recent events and registrations
```

#### **External Monitoring**
```bash
# Vercel Analytics
# Access: Vercel Dashboard → LocalLoop → Analytics

# Supabase Monitoring  
# Access: Supabase Dashboard → Project → Reports

# Stripe Monitoring
# Access: Stripe Dashboard → Dashboard
```

---

## 🛠️ Troubleshooting Quick Reference

### **Application Won't Load**
```bash
# 1. Check Vercel deployment status
curl -I https://localloop.com
# Expected: HTTP/2 200

# 2. Verify DNS resolution
nslookup localloop.com
# Expected: Points to Vercel infrastructure

# 3. Check recent deployments
# Access: Vercel Dashboard → Deployments
# Look for failed deployments or recent changes

# 4. Review function logs
# Access: Vercel Dashboard → Functions → View Logs
# Check for runtime errors or startup failures
```

### **Database Connection Issues**
```bash
# 1. Test database connectivity
curl -f "https://localloop.com/api/health/database"

# 2. Check Supabase status
# Access: https://status.supabase.com/

# 3. Verify connection limits
# Access: Supabase Dashboard → Settings → Database
# Check active connections vs limits

# 4. Review database logs
# Access: Supabase Dashboard → Logs → Database
```

### **Payment Processing Failures**
```bash
# 1. Check Stripe service status
# Access: https://status.stripe.com/

# 2. Verify webhook endpoints
# Access: Stripe Dashboard → Developers → Webhooks
# Verify webhook URLs are accessible

# 3. Test payment flow manually
# Use staging environment to process test payment

# 4. Review payment logs
# Access: Stripe Dashboard → Events
# Filter by failed events in last 24h
```

### **Email Delivery Issues**
```bash
# 1. Check Resend service status
# Access: Resend Dashboard → Activity

# 2. Verify email templates
# Access: LocalLoop Admin → Email Templates
# Test template rendering

# 3. Check DNS records
# Verify SPF, DKIM, and DMARC records for domain

# 4. Review bounce/complaint rates
# Access: Resend Dashboard → Analytics
```

---

## 🔒 Security Procedures

### **Security Incident Response**

#### **Suspected Security Breach**
```bash
# IMMEDIATE ACTIONS (within 5 minutes)
# 1. Document incident details
# 2. Preserve evidence (logs, screenshots)
# 3. Notify security team/management

# CONTAINMENT (within 15 minutes)
# 1. Identify affected systems
# 2. Isolate compromised accounts if necessary
# 3. Review recent access logs
# 4. Change critical passwords/keys if needed

# INVESTIGATION (within 1 hour)
# 1. Analyze logs for breach timeline
# 2. Identify data potentially accessed
# 3. Document attack vectors
# 4. Assess business impact

# COMMUNICATION (within 4 hours)
# 1. Notify affected users if required
# 2. Update stakeholders
# 3. Prepare public communication if needed
# 4. Coordinate with legal team if required
```

#### **Suspicious Activity Detection**
```sql
-- Check for unusual login patterns
SELECT 
    user_id,
    COUNT(*) as login_attempts,
    COUNT(DISTINCT ip_address) as unique_ips,
    MIN(created_at) as first_attempt,
    MAX(created_at) as last_attempt
FROM auth.audit_log_entries 
WHERE 
    event_type = 'token_refreshed'
    AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 50 OR COUNT(DISTINCT ip_address) > 5;

-- Check for elevated privilege actions
SELECT *
FROM audit_logs
WHERE 
    action IN ('user_role_change', 'admin_access', 'data_export')
    AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### **Access Control Management**

#### **Grant Admin Access**
```sql
-- Temporarily grant admin access
UPDATE user_roles 
SET role = 'admin', 
    updated_at = NOW(),
    updated_by = 'emergency_access_protocol'
WHERE user_id = '[USER_ID]';

-- Record access grant in audit log
INSERT INTO audit_logs (
    user_id, action, details, created_at
) VALUES (
    '[GRANTING_ADMIN_ID]', 
    'emergency_admin_access_granted',
    'Granted emergency admin access to user [USER_ID] due to [REASON]',
    NOW()
);
```

#### **Revoke Access (Compromised Account)**
```sql
-- Immediately disable user account
UPDATE auth.users 
SET banned_until = NOW() + INTERVAL '30 days'
WHERE id = '[COMPROMISED_USER_ID]';

-- Revoke all sessions
DELETE FROM auth.sessions 
WHERE user_id = '[COMPROMISED_USER_ID]';

-- Log security action
INSERT INTO audit_logs (
    user_id, action, details, created_at
) VALUES (
    '[ADMIN_USER_ID]',
    'account_suspended_security',
    'Account suspended due to suspected compromise',
    NOW()
);
```

---

## 📞 Escalation Procedures

### **Incident Severity Levels**

#### **Critical (P0) - Immediate Response**
- Complete application outage
- Data breach suspected
- Payment processing completely down
- Database corruption detected

**Response Time**: 15 minutes
**Escalation**: Immediately notify all stakeholders

#### **High (P1) - 1 Hour Response**
- Partial application outage
- Significant performance degradation  
- Payment processing intermittent failures
- Core functionality impacted

**Response Time**: 1 hour
**Escalation**: Notify technical lead and product owner

#### **Medium (P2) - 4 Hour Response**
- Minor feature outages
- Performance degradation in non-critical areas
- Email delivery delays
- Non-critical API failures

**Response Time**: 4 hours during business hours
**Escalation**: Notify technical lead

#### **Low (P3) - Next Business Day**
- Cosmetic issues
- Minor performance optimizations needed
- Non-urgent feature requests
- Documentation updates

**Response Time**: Next business day
**Escalation**: Standard ticket queue

### **Contact Information Template**
```
Technical Lead: [Name] - [Phone] - [Email] - [Slack]
Product Owner: [Name] - [Phone] - [Email] - [Slack]  
DevOps Team: [Email] - [Slack Channel]
Security Team: [Email] - [Emergency Contact]
Management: [Name] - [Phone] - [Email]
```

---

## 📚 Additional Resources

### **Documentation Links**
- **Architecture Overview**: [LocalLoop-Application-Architecture.md](../LocalLoop-Application-Architecture.md)
- **Deployment Guide**: [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Environment Setup**: [PRODUCTION_ENVIRONMENT_SETUP.md](./PRODUCTION_ENVIRONMENT_SETUP.md)
- **Backup Procedures**: [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md)
- **Testing Guide**: [TESTING-GUIDE.md](../TESTING-GUIDE.md)

### **External Resources**
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Stripe Documentation**: https://stripe.com/docs
- **Next.js Documentation**: https://nextjs.org/docs

### **Training Materials**
- **LocalLoop Admin Training**: [Link to training materials]
- **Incident Response Training**: [Link to security training]
- **System Architecture Overview**: [Link to architecture training]

---

## 📝 Maintenance Log Template

```
Date: [YYYY-MM-DD]
Operator: [Name]
Task: [Description]
Duration: [Start - End time]
Systems Affected: [List]
Issues Encountered: [Description]
Resolution: [Steps taken]
Follow-up Required: [Yes/No - Details]
```

---

**Last Updated**: January 2025
**Next Review**: Monthly
**Maintained By**: LocalLoop DevOps Team 