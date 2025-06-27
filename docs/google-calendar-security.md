# Google Calendar Integration Security Documentation

## Overview

LocalLoop implements enterprise-grade security measures for Google Calendar integration, ensuring OAuth tokens and user data are protected with industry-standard encryption and security practices.

## Token Storage Security

### Encryption Implementation

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- Provides both confidentiality and authenticity
- 256-bit key size for maximum security
- Built-in authentication tag prevents tampering

**Key Management**:
- Environment variable: `GOOGLE_CALENDAR_ENCRYPTION_KEY`
- Key derivation using scrypt with salt
- Unique initialization vector (IV) for each encryption
- Production deployments MUST set custom encryption key

**Storage Flow**:
1. OAuth tokens received from Google Calendar API
2. Tokens serialized to JSON format
3. AES-256-GCM encryption with random IV
4. Authentication tag generated for integrity verification
5. Encrypted data stored in Supabase users table

### Database Schema Security

**Table**: `users`
**Encrypted Fields**:
- `google_calendar_token` - Encrypted OAuth tokens (AES-256-GCM)
- `google_calendar_connected` - Connection status (boolean)
- `google_calendar_connected_at` - Connection timestamp
- `google_calendar_expires_at` - Token expiration timestamp
- `google_calendar_sync_enabled` - Sync preference (boolean)

**Security Features**:
- No plain-text token storage
- Row-level security (RLS) enabled
- User isolation through Supabase authentication
- Automatic token expiration tracking

## Security Audit & Logging

### Audit Events Logged

**Token Storage Operations**:
- Token encryption and storage events
- User ID and timestamp
- Token types and expiration data
- Success/failure status

**Token Access Operations**:
- Token decryption and access events
- User authentication verification
- Token refresh operations
- Connection health checks

**Connection Management**:
- OAuth flow initiation and completion
- Connection disconnection events
- Failed authentication attempts
- Security validation failures

### Log Format

```json
{
  "event": "token_storage",
  "userId": "user-uuid",
  "tokenTypes": ["access_token", "refresh_token"],
  "hasRefreshToken": true,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## API Security

### Authentication Requirements

**All API Endpoints Require**:
- Valid Supabase user session
- User authentication verification
- CSRF protection via OAuth state parameter

**Security Headers**:
- Content-Type validation
- Request method restrictions
- Error response sanitization

### Rate Limiting

**Recommended Production Settings**:
- Token refresh: 10 requests per minute per user
- Status checks: 60 requests per minute per user
- Connection/disconnection: 5 requests per minute per user

## Production Security Checklist

### Environment Configuration

- [ ] Set custom `GOOGLE_CALENDAR_ENCRYPTION_KEY` (32+ characters)
- [ ] Configure proper `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Set secure `GOOGLE_REDIRECT_URI` (HTTPS only)
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Configure database backup encryption

### Network Security

- [ ] HTTPS enforcement for all calendar endpoints
- [ ] Secure OAuth redirect URIs (no wildcards)
- [ ] CSP headers including calendar domains
- [ ] CORS restrictions for API endpoints

### Monitoring & Alerting

- [ ] Token encryption/decryption failure alerts
- [ ] Unusual token access pattern detection
- [ ] Failed authentication attempt monitoring
- [ ] Token expiration warnings

### Compliance Considerations

**GDPR Compliance**:
- User consent for calendar access clearly documented
- Right to data deletion implemented (disconnect functionality)
- Data retention policies for calendar tokens
- Data processing transparency in privacy policy

**SOC 2 Type II**:
- Encryption at rest and in transit
- Access logging and audit trails
- Incident response procedures
- Regular security assessments

## Security Best Practices

### Development

1. **Never log plain-text tokens** - Only log metadata
2. **Use environment variables** for all secrets
3. **Test encryption/decryption** in development environment
4. **Validate token expiration** before API calls
5. **Implement proper error handling** without exposing sensitive data

### Production

1. **Regular token health monitoring** - Use `/api/auth/google/status`
2. **Automated token refresh** - Proactive refresh before expiration
3. **Security incident response** - Clear procedures for token compromise
4. **Regular security audits** - Review logs and access patterns
5. **Backup and recovery** - Secure backup of encrypted token data

## Troubleshooting Security Issues

### Common Issues

**Token Decryption Failures**:
- Verify encryption key consistency across deployments
- Check for data corruption in database
- Validate base64 encoding/decoding process

**Authentication Errors**:
- Verify Supabase user session validity
- Check OAuth state parameter validation
- Confirm redirect URI configuration

**Connection Health Problems**:
- Monitor token expiration timestamps
- Check Google Calendar API quotas
- Verify network connectivity to Google APIs

### Security Incident Response

1. **Immediate Actions**:
   - Disconnect affected user calendars
   - Rotate encryption keys if compromised
   - Audit access logs for suspicious activity

2. **Investigation**:
   - Review audit logs for attack vectors
   - Check for data exfiltration attempts
   - Validate encryption integrity

3. **Recovery**:
   - Re-encrypt tokens with new keys
   - Notify affected users if required
   - Update security measures based on findings

## Contact & Support

For security-related questions or incidents:
- Review GitHub issues for known security topics
- Follow responsible disclosure for security vulnerabilities
- Document security improvements in pull requests

---

**Last Updated**: January 1, 2025
**Document Version**: 1.0
**Security Review**: Pending 