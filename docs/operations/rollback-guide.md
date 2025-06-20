# LocalLoop Rollback Guide 🚨

## Overview
This guide provides comprehensive instructions for rolling back LocalLoop deployments in emergency situations. We use the **official Vercel rollback commands** - simple, reliable, and well-documented.

## 🚀 Quick Emergency Rollback (30 seconds)

**For immediate emergencies, use Vercel Dashboard:**

1. **Access Vercel Dashboard**: https://vercel.com/jacksonr64/localloop
2. **Navigate to Deployments tab**
3. **Find the last known good deployment**
4. **Click the three dots (⋯) next to the deployment**
5. **Select "Promote to Production"**
6. **Confirm the rollback**

⏱️ **Total time: ~30 seconds**

## 🤖 Automated Rollback via GitHub Actions

### Simple Workflow Approach
Our GitHub Actions workflow uses the **official Vercel CLI rollback commands** - no complex parsing or custom logic needed!

### Prerequisites
- GitHub repository access
- VERCEL_TOKEN secret configured in repository settings

### How to Trigger

1. **Go to GitHub Actions**: https://github.com/JacksonR64/LocalLoop/actions
2. **Select "🔄 Vercel Rollback" workflow**
3. **Click "Run workflow"**
4. **Choose your rollback method:**
   - **Automatic Rollback**: Leave "deployment_url" empty - rolls back to previous deployment
   - **Specific Rollback**: Enter a specific deployment URL to rollback to that exact version
5. **Enter reason**: Provide a reason for the rollback (for logging)
6. **Click "Run workflow"**

### Workflow Commands Used
```bash
# Automatic rollback to previous deployment
vercel rollback --token $VERCEL_TOKEN --yes

# Rollback to specific deployment
vercel rollback [deployment-url] --token $VERCEL_TOKEN --yes
```

### Example Usage

**Automatic Rollback:**
- Deployment URL: *(leave empty)*
- Reason: "Critical bug in latest release"

**Specific Rollback:**
- Deployment URL: `https://local-loop-abc123.vercel.app`
- Reason: "Rollback to version before payment issue"

## 🔧 Manual CLI Rollback

If you have Vercel CLI installed locally:

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Automatic rollback to previous deployment
vercel rollback

# Rollback to specific deployment
vercel rollback https://your-deployment-url.vercel.app
```

## 📊 Verification Steps

After any rollback:

1. **Check the site**: Visit https://localloop.vercel.app
2. **Verify functionality**: Test critical features
3. **Check deployment status**: 
   ```bash
   vercel ls
   ```
4. **Monitor logs**: Watch for any errors in Vercel dashboard

## 🚨 Emergency Procedures

### Critical Production Issue
1. **Immediate**: Use Vercel Dashboard rollback (30 seconds)
2. **Follow-up**: Trigger GitHub Actions rollback for documentation
3. **Investigation**: Identify and fix the root cause
4. **Communication**: Notify team and stakeholders

### Planned Rollback
1. **Use GitHub Actions workflow** for proper logging and audit trail
2. **Document the reason** in the workflow input
3. **Verify the rollback** was successful
4. **Plan the fix** for the next deployment

## 🛠️ Troubleshooting

### Workflow Fails
- **Check VERCEL_TOKEN**: Ensure the secret is properly configured
- **Verify permissions**: Ensure the token has deployment permissions
- **Check deployment URL**: If using specific rollback, verify the URL exists

### Rollback Doesn't Work
- **Hobby Plan Limitation**: Can only rollback to immediately preceding deployment
- **Try Dashboard Method**: Use Vercel dashboard as backup
- **Contact Support**: If issues persist, contact Vercel support

## 📝 Best Practices

1. **Always provide a clear reason** when triggering rollbacks
2. **Use automatic rollback** unless you need a specific version
3. **Test after rollback** to ensure the issue is resolved
4. **Document the incident** for future reference
5. **Fix the root cause** before the next deployment

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/jacksonr64/localloop
- **GitHub Actions**: https://github.com/JacksonR64/LocalLoop/actions
- **Rollback Workflow**: https://github.com/JacksonR64/LocalLoop/actions/workflows/rollback.yml
- **Vercel CLI Docs**: https://vercel.com/docs/cli/rollback

---

**Remember**: The Vercel dashboard method is fastest for true emergencies. Use GitHub Actions for planned rollbacks with proper documentation and audit trails.

## 🔧 Finding Deployment URLs

### Via Vercel Dashboard
1. Go to: https://vercel.com/jacksonr64/localloop
2. Click "Deployments" tab
3. Find the deployment you want to rollback to
4. Copy the deployment URL (e.g., `https://localloop-abc123.vercel.app`)

### Via Vercel CLI
```bash
# List recent deployments
vercel ls

# Get specific deployment info
vercel inspect <deployment-url>
```

## 📋 Rollback Checklist

### Before Rollback
- [ ] Identify the issue requiring rollback
- [ ] Determine the last known good deployment
- [ ] Notify team members about the rollback
- [ ] Document the issue for post-mortem

### During Rollback
- [ ] Choose appropriate rollback method (dashboard vs. automated)
- [ ] Execute rollback procedure
- [ ] Monitor deployment status
- [ ] Verify application functionality

### After Rollback
- [ ] Confirm application is working correctly
- [ ] Update team on rollback completion
- [ ] Create issue for bug fix
- [ ] Plan hotfix deployment if needed

## 🔍 Troubleshooting

### Common Issues

#### 1. "VERCEL_TOKEN not found" error
**Solution**: Verify that VERCEL_TOKEN secret is configured in GitHub repository settings
- Go to: Settings → Secrets and variables → Actions
- Ensure VERCEL_TOKEN is present and valid

#### 2. "Deployment not found" error
**Solution**: Verify the deployment URL is correct and accessible
```bash
# Check if deployment exists
vercel inspect <deployment-url>
```

#### 3. Workflow fails to trigger
**Solution**: Check repository permissions and workflow file syntax
- Ensure you have Actions write permissions
- Verify `.github/workflows/rollback.yml` syntax

#### 4. Rollback succeeds but app still broken
**Solution**: 
- Check if the issue is in the database/external services
- Consider rolling back database migrations if applicable
- Verify DNS propagation (may take a few minutes)

## 🚨 Emergency Contacts

In case of critical issues during rollback:
- **Technical Lead**: [Add contact info]
- **DevOps Team**: [Add contact info]
- **On-call Engineer**: [Add contact info]

## 📚 Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [CI/CD Pipeline](../.github/workflows/ci-pipeline.yml)
- [Vercel Configuration](../vercel.json)
- [Environment Setup](../scripts/env-setup.sh)

## 🔄 Recovery Procedures

### After Emergency Rollback
1. **Investigate root cause** of the issue
2. **Create hotfix branch** from the rolled-back version
3. **Apply minimal fix** to resolve the critical issue
4. **Test thoroughly** in staging environment
5. **Deploy hotfix** through normal CI/CD pipeline
6. **Monitor closely** after deployment

### Long-term Recovery
1. **Conduct post-mortem** to understand what went wrong
2. **Update testing procedures** to catch similar issues
3. **Improve monitoring** to detect issues faster
4. **Update rollback procedures** based on lessons learned

---

**Last Updated**: [Current Date]
**Tested**: ✅ Workflow successfully triggered and validated
**Status**: Ready for emergency use 