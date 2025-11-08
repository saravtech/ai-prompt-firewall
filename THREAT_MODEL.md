# Threat Model Summary

## Assets

### Primary Assets
1. **User Prompts**: Sensitive user input containing potential PII/PHI
2. **AI Responses**: Model outputs that may contain sensitive information
3. **Logs Database**: Historical records of all queries and decisions
4. **Policy Rules**: Detection rules and security configurations
5. **Admin Credentials**: Access to admin console and API

### Secondary Assets
- API endpoints and authentication tokens
- Database connection strings
- Session cookies

## Threat Vectors

### 1. PII/PHI Exposure
**Risk**: High  
**Description**: User prompts or AI responses containing sensitive data (emails, SSNs, medical info) could be exposed.

**Mitigations**:
- ✅ Real-time PII detection using regex patterns
- ✅ Automatic redaction/sanitization of detected PII
- ✅ Blocking of high-risk prompts
- ✅ Secure logging with metadata only (no raw PII in logs)

### 2. Prompt Injection Attacks
**Risk**: High  
**Description**: Malicious users attempting to manipulate AI behavior through crafted prompts.

**Mitigations**:
- ✅ Detection of 15+ injection patterns
- ✅ Risk scoring system
- ✅ Automatic blocking of high-risk injections
- ✅ Explainability showing why prompts were blocked

### 3. Unauthorized Admin Access
**Risk**: Medium  
**Description**: Unauthorized access to admin console could allow rule manipulation or log access.

**Mitigations**:
- ✅ Password-protected admin console
- ✅ Session-based authentication
- ✅ API key authentication for programmatic access
- ✅ Protected API routes via middleware
- ⚠️ **Recommendation**: Add rate limiting and 2FA

### 4. Database Breach
**Risk**: Medium  
**Description**: Compromised database could expose logs and policies.

**Mitigations**:
- ✅ Environment variable for connection strings
- ✅ SQLite for local dev (file-based)
- ✅ PostgreSQL with connection pooling for production
- ⚠️ **Recommendation**: Encrypt sensitive fields, enable database backups

### 5. API Abuse / DoS
**Risk**: Low-Medium  
**Description**: Malicious actors could overwhelm the API with requests.

**Mitigations**:
- ✅ Serverless architecture (auto-scaling)
- ⚠️ **Recommendation**: Implement rate limiting (Vercel Pro or Cloud Armor)
- ⚠️ **Recommendation**: Add request size limits

### 6. Log Injection / Data Poisoning
**Risk**: Low  
**Description**: Malicious data in logs could affect analysis or cause issues.

**Mitigations**:
- ✅ Input validation via Zod schemas
- ✅ JSON sanitization
- ✅ Structured logging format

## Security Controls

### Authentication & Authorization
- Password-based admin authentication
- Session tokens with HTTP-only cookies
- API key support for programmatic access
- Middleware protection for admin routes

### Data Protection
- PII detection and redaction
- Secure storage of credentials in environment variables
- HTTPS enforcement in production
- Database connection encryption

### Monitoring & Logging
- Comprehensive audit logs
- Risk scoring and decision tracking
- Exportable logs for analysis
- Error logging for debugging

## Risk Assessment Matrix

| Threat | Likelihood | Impact | Risk Level | Mitigation Status |
|--------|-----------|--------|------------|-------------------|
| PII Exposure | Medium | High | **High** | ✅ Mitigated |
| Prompt Injection | Medium | High | **High** | ✅ Mitigated |
| Unauthorized Access | Low | High | **Medium** | ✅ Partially Mitigated |
| Database Breach | Low | Medium | **Medium** | ✅ Partially Mitigated |
| API Abuse | Low | Low | **Low** | ⚠️ Needs Enhancement |
| Log Injection | Low | Low | **Low** | ✅ Mitigated |

## Recommendations for Production

### Immediate (Before Production)
1. ✅ Change default admin password
2. ✅ Generate strong API keys
3. ✅ Use PostgreSQL with encrypted connections
4. ✅ Enable HTTPS only

### Short-term (First Month)
1. ⚠️ Implement rate limiting
2. ⚠️ Add request size limits
3. ⚠️ Set up monitoring/alerts
4. ⚠️ Enable database backups

### Long-term (Ongoing)
1. ⚠️ Consider 2FA for admin access
2. ⚠️ Implement anomaly detection
3. ⚠️ Regular security audits
4. ⚠️ Penetration testing
5. ⚠️ Compliance certifications (SOC 2, HIPAA if handling PHI)

## Compliance Considerations

### GDPR
- ✅ PII detection and redaction
- ✅ Data export capability
- ⚠️ **Needed**: Data deletion/retention policies
- ⚠️ **Needed**: Privacy policy and consent mechanisms

### HIPAA (if handling PHI)
- ✅ PHI detection patterns
- ⚠️ **Needed**: BAA with cloud providers
- ⚠️ **Needed**: Enhanced encryption
- ⚠️ **Needed**: Audit logging requirements

## Incident Response

### If PII is exposed:
1. Immediately block the affected prompt/response
2. Review logs to identify scope
3. Notify affected users (if applicable)
4. Rotate credentials
5. Review and update detection rules

### If system is compromised:
1. Isolate affected systems
2. Preserve logs for forensics
3. Rotate all credentials
4. Review access logs
5. Patch vulnerabilities

