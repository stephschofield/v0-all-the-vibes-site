````skill
---
name: security-analysis
description: 'Enterprise security analysis using Azure Well-Architected Framework and OWASP standards. Use for security audits, threat modeling, vulnerability assessment, compliance verification, and secure code review. Triggers on: security review, security audit, threat model, vulnerability scan, OWASP, penetration test, compliance check, secure code review, WAF security.'
---

# Enterprise Security Analysis Skill

Comprehensive security analysis framework combining Azure Well-Architected Framework Security Pillar and OWASP standards for enterprise-grade application security.

## When to Use This Skill

- User asks for "security review", "security audit", or "penetration test"
- User mentions "OWASP", "threat model", or "vulnerability"
- User wants "compliance check" or "secure code review"
- User asks about "authentication", "authorization", or "encryption"
- User mentions "Azure security", "WAF security", or "Zero Trust"

## The Job

1. Identify the scope and applicable standards
2. Perform systematic security analysis
3. Document findings with severity ratings
4. Provide actionable remediation guidance
5. Generate compliance verification checklist

---

## Azure Well-Architected Framework: Security Pillar

The Security pillar ensures confidentiality, integrity, and availability (CIA triad) through Zero Trust principles.

### Zero Trust Principles

| Principle | Implementation |
|-----------|---------------|
| **Verify explicitly** | Always authenticate and authorize based on all available data points |
| **Least privilege** | Limit access with Just-In-Time (JIT) and Just-Enough-Access (JEA) |
| **Assume breach** | Minimize blast radius, segment access, verify end-to-end encryption |

### Security Design Checklist (SE:01 - SE:12)

#### SE:01: Security Baseline
Establish a security baseline aligned with compliance requirements, industry standards, and platform recommendations.

**What to verify:**
- [ ] Security baseline documented
- [ ] Compliance requirements identified (SOC2, HIPAA, GDPR, PCI-DSS)
- [ ] Regular baseline reviews scheduled
- [ ] Deviations tracked and justified

**React/Next.js considerations:**
- Document security requirements in README
- Use security-focused ESLint rules
- Configure CSP headers in middleware

---

#### SE:02: Secure Development Lifecycle
Maintain a secure development lifecycle with hardened, automated, and auditable software supply chain.

**What to verify:**
- [ ] Threat modeling performed for new features
- [ ] Security requirements in user stories
- [ ] Code review includes security checks
- [ ] Dependency scanning enabled
- [ ] SAST/DAST tools integrated

**Implementation:**
```typescript
// package.json - Security-focused scripts
{
  "scripts": {
    "security:audit": "npm audit --audit-level=high",
    "security:deps": "npx depcheck && npx npm-check-updates",
    "lint:security": "eslint --plugin security ."
  }
}
```

---

#### SE:03: Data Classification
Classify and consistently apply sensitivity labels on all workload data.

**Classification levels:**
| Level | Examples | Protection |
|-------|----------|------------|
| **Public** | Marketing content | Integrity protection |
| **Internal** | Documentation | Access control |
| **Confidential** | User emails, names | Encryption + access control |
| **Restricted** | Passwords, PII, financial | Strong encryption + audit + strict access |

**What to verify:**
- [ ] Data inventory maintained
- [ ] Classification labels applied
- [ ] Handling procedures documented
- [ ] Retention policies defined

---

#### SE:04: Segmentation
Create intentional segmentation and perimeters in architecture design.

**What to verify:**
- [ ] Network segmentation implemented
- [ ] Role-based access boundaries defined
- [ ] Service isolation configured
- [ ] Workload identity separation

**Next.js patterns:**
```typescript
// Segment by route group permissions
// app/(public)/          - No auth required
// app/(authenticated)/   - Login required
// app/(admin)/           - Admin role required

// middleware.ts
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  
  if (isAdminRoute && session?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
```

---

#### SE:05: Identity and Access Management
Implement strict, conditional, and auditable IAM across all workload users and components.

**What to verify:**
- [ ] Authentication required for protected resources
- [ ] Authorization checked at every access point
- [ ] MFA enabled for sensitive operations
- [ ] Session management secure
- [ ] Service accounts use managed identities

**Secure authentication pattern:**
```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.permissions = token.permissions;
      return session;
    },
  },
});
```

**Authorization pattern:**
```typescript
// lib/auth/permissions.ts
export function canAccess(
  user: User | null,
  resource: string,
  action: 'read' | 'write' | 'delete'
): boolean {
  if (!user) return false;
  
  const permissions = {
    admin: ['read', 'write', 'delete'],
    editor: ['read', 'write'],
    viewer: ['read'],
  };
  
  return permissions[user.role]?.includes(action) ?? false;
}

// Usage in Server Action
'use server';

export async function updatePost(postId: string, data: FormData) {
  const session = await auth();
  
  if (!canAccess(session?.user, 'posts', 'write')) {
    throw new Error('Forbidden');
  }
  
  // Proceed with update...
}
```

---

#### SE:06: Network Security
Isolate, filter, and control network traffic across ingress and egress flows.

**What to verify:**
- [ ] HTTPS enforced everywhere
- [ ] API endpoints protected
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] DDoS protection enabled

**Next.js security headers:**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  },
];

module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

**Rate limiting:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  return { allowed: success, limit, remaining, retryAfter: Math.ceil((reset - Date.now()) / 1000) };
}
```

---

#### SE:07: Encryption
Encrypt data using modern, industry-standard methods.

**What to verify:**
- [ ] TLS 1.2+ for all connections
- [ ] Database encryption at rest
- [ ] Sensitive fields encrypted (PII, credentials)
- [ ] Key rotation policy defined
- [ ] No secrets in client code

**Encryption patterns:**
```typescript
// lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const ALGORITHM = 'aes-256-gcm';

export async function encrypt(text: string): Promise<string> {
  const key = await scryptAsync(process.env.ENCRYPTION_KEY!, 'salt', 32) as Buffer;
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export async function decrypt(encryptedText: string): Promise<string> {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const key = await scryptAsync(process.env.ENCRYPTION_KEY!, 'salt', 32) as Buffer;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

#### SE:08: Resource Hardening
Harden all workload components by reducing attack surface.

**What to verify:**
- [ ] Unused features disabled
- [ ] Default credentials changed
- [ ] Debug mode disabled in production
- [ ] Error messages don't leak information
- [ ] Dependencies minimized

**Production hardening:**
```typescript
// app/api/[...]/route.ts
export async function GET(request: Request) {
  try {
    // Business logic...
  } catch (error) {
    // Log full error server-side
    console.error('API Error:', error);
    
    // Return generic message to client
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// next.config.js
module.exports = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
};
```

---

#### SE:09: Secret Management
Protect application secrets by hardening storage and restricting access.

**What to verify:**
- [ ] Secrets in environment variables (never in code)
- [ ] Different secrets per environment
- [ ] Secret rotation automated
- [ ] Access audited
- [ ] No secrets in client-side code

**Secret management patterns:**
```typescript
// ❌ NEVER do this
const API_KEY = 'sk_live_123...';  // Hardcoded
export const secret = process.env.NEXT_PUBLIC_SECRET;  // Client-exposed

// ✅ Correct patterns
// .env.local (never committed)
DATABASE_URL="postgresql://user:pass@host/db"
API_SECRET="sk_live_..."

// Validate at startup
const requiredEnvVars = ['DATABASE_URL', 'API_SECRET', 'NEXTAUTH_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

---

#### SE:10: Threat Detection & Monitoring
Implement holistic monitoring with modern threat detection.

**What to verify:**
- [ ] Security events logged
- [ ] Alerting configured
- [ ] Log retention policy defined
- [ ] Anomaly detection enabled
- [ ] Incident correlation possible

**Audit logging pattern:**
```typescript
// lib/audit.ts
type AuditEvent = {
  action: string;
  actor: string;
  resource: string;
  resourceId?: string;
  outcome: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
};

export async function auditLog(event: AuditEvent) {
  await db.auditLog.create({
    data: {
      ...event,
      timestamp: new Date(),
    },
  });
  
  // For critical events, also send to SIEM
  if (event.action.startsWith('auth.') || event.outcome === 'failure') {
    await sendToSIEM(event);
  }
}

// Usage
await auditLog({
  action: 'user.delete',
  actor: session.user.id,
  resource: 'user',
  resourceId: targetUserId,
  outcome: 'success',
  ip: request.headers.get('x-forwarded-for'),
});
```

---

#### SE:11: Security Testing
Establish comprehensive testing regimen combining multiple approaches.

**What to verify:**
- [ ] SAST integrated in CI/CD
- [ ] DAST scheduled regularly
- [ ] Penetration testing annual
- [ ] Dependency scanning automated
- [ ] Security unit tests exist

**Security testing setup:**
```typescript
// vitest.config.ts - Include security tests
export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/*.security.test.ts'],
  },
});

// auth.security.test.ts
describe('Authentication Security', () => {
  it('rejects requests without valid session', async () => {
    const response = await fetch('/api/admin/users');
    expect(response.status).toBe(401);
  });
  
  it('prevents IDOR attacks', async () => {
    // Login as user A
    const sessionA = await loginAs('userA');
    
    // Try to access user B's data
    const response = await fetch('/api/users/userB/profile', {
      headers: { Authorization: `Bearer ${sessionA.token}` },
    });
    
    expect(response.status).toBe(403);
  });
  
  it('rate limits failed login attempts', async () => {
    for (let i = 0; i < 10; i++) {
      await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      });
    }
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    });
    
    expect(response.status).toBe(429);
  });
});
```

---

#### SE:12: Incident Response
Define and test effective incident response procedures.

**What to verify:**
- [ ] Incident response plan documented
- [ ] Roles and responsibilities defined
- [ ] Communication channels established
- [ ] Recovery procedures tested
- [ ] Post-incident review process

---

## OWASP Top 10:2025

### A01: Broken Access Control

**What it is:** Failures in enforcing policies where users should only act within their intended permissions.

**What to check:**
- [ ] Authorization checked on every request
- [ ] No direct object references exposed
- [ ] URL manipulation prevented
- [ ] CORS properly configured
- [ ] Token validation on all protected routes

**Vulnerable pattern:**
```typescript
// ❌ Vulnerable: No authorization check
export async function getOrder(orderId: string) {
  return db.order.findUnique({ where: { id: orderId } });
}

// ✅ Secure: Verify ownership
export async function getOrder(orderId: string, userId: string) {
  const order = await db.order.findUnique({ 
    where: { id: orderId, userId }  // Ensure user owns this order
  });
  if (!order) throw new Error('Order not found');
  return order;
}
```

---

### A02: Security Misconfiguration

**What it is:** Missing security hardening, unnecessary features enabled, default credentials.

**What to check:**
- [ ] Security headers configured
- [ ] Debug mode disabled in production
- [ ] Default accounts/passwords changed
- [ ] Error messages don't leak info
- [ ] Unnecessary features disabled

---

### A03: Software Supply Chain Failures

**What it is:** Vulnerabilities from third-party dependencies or compromised CI/CD pipelines.

**What to check:**
- [ ] All dependencies audited (`npm audit`)
- [ ] Lock file committed
- [ ] Dependency updates automated
- [ ] Build integrity verified
- [ ] Signed commits (optional but recommended)

**Setup:**
```bash
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm audit --audit-level=high
```

---

### A04: Cryptographic Failures

**What it is:** Failures in protecting data in transit or at rest through proper cryptography.

**What to check:**
- [ ] TLS 1.2+ enforced
- [ ] Passwords properly hashed (bcrypt, argon2)
- [ ] Sensitive data encrypted at rest
- [ ] No weak algorithms (MD5, SHA1)
- [ ] Keys properly managed

---

### A05: Injection

**What it is:** Hostile data sent to interpreters (SQL, NoSQL, OS, LDAP).

**What to check:**
- [ ] All input validated with schemas
- [ ] Parameterized queries used
- [ ] Output encoded for context
- [ ] No dynamic query construction

**Prevention:**
```typescript
// ❌ Vulnerable: String interpolation
const users = await db.$queryRaw`SELECT * FROM users WHERE name = '${name}'`;

// ✅ Secure: Parameterized query
const users = await db.$queryRaw`SELECT * FROM users WHERE name = ${name}`;

// ✅ Better: Use ORM with validation
const nameSchema = z.string().min(1).max(100);
const parsed = nameSchema.parse(name);
const users = await db.user.findMany({ where: { name: parsed } });
```

---

### A06: Insecure Design

**What it is:** Missing or ineffective security controls and patterns in design.

**What to check:**
- [ ] Threat modeling performed
- [ ] Security requirements defined
- [ ] Defense in depth implemented
- [ ] Fail-safe defaults configured
- [ ] Least privilege enforced

---

### A07: Authentication Failures

**What it is:** Confirmation of user identity, authentication, and session management weaknesses.

**What to check:**
- [ ] Credential stuffing protection
- [ ] Brute force protection
- [ ] Session fixation prevention
- [ ] Secure password storage
- [ ] MFA available

---

### A08: Software or Data Integrity Failures

**What it is:** Code and infrastructure that doesn't protect against integrity violations.

**What to check:**
- [ ] CI/CD pipeline secured
- [ ] Updates from verified sources
- [ ] Serialized data validated
- [ ] Dependencies verified

---

### A09: Security Logging and Alerting Failures

**What it is:** Insufficient logging, detection, monitoring, and response.

**What to check:**
- [ ] Login attempts logged
- [ ] Access control failures logged
- [ ] Input validation failures logged
- [ ] Alerts configured for anomalies
- [ ] Logs tamper-proof

---

### A10: Mishandling of Exceptional Conditions

**What it is:** Server-side request forgery allowing attackers to send crafted requests.

**What to check:**
- [ ] URL validation for user input
- [ ] Allow-list for external requests
- [ ] Split DNS prevented
- [ ] Network segmentation

---

## Security Review Checklist

### Quick Review (15 min)
- [ ] Authentication on protected routes
- [ ] Authorization checks in Server Actions
- [ ] Input validation with Zod
- [ ] No secrets in client code
- [ ] Security headers configured

### Standard Review (1-2 hours)
All of quick review, plus:
- [ ] OWASP Top 10 categories assessed
- [ ] Session management reviewed
- [ ] Error handling verified
- [ ] Audit logging present
- [ ] Dependencies audited

### Comprehensive Audit (1+ days)
All of standard review, plus:
- [ ] Full WAF SE:01-SE:12 checklist
- [ ] Threat model created/updated
- [ ] Penetration testing
- [ ] Compliance verification
- [ ] Architecture security review

## Severity Ratings

| Rating | Description | SLA |
|--------|-------------|-----|
| **Critical** | Actively exploitable, data breach risk | Fix immediately |
| **High** | Significant vulnerability, exploitation possible | 24-48 hours |
| **Medium** | Moderate risk, requires conditions | 1 week |
| **Low** | Minor issue, defense in depth | Next release |
| **Informational** | Best practice recommendation | Backlog |

## Report Template

```markdown
# Security Assessment Report

**Target:** [Application/Component]
**Date:** [Date]
**Assessor:** Security Reviewer Agent
**Classification:** [Confidential/Internal]

## Executive Summary

Overall risk level: [Critical/High/Medium/Low]

| Severity | Count |
|----------|-------|
| Critical | X |
| High | X |
| Medium | X |
| Low | X |

## Findings

### [CRITICAL-001] Finding Title
**Category:** OWASP A0X / WAF SE:XX
**CVSS:** X.X
**Location:** [file:line]

**Description:**
[What the vulnerability is]

**Impact:**
[What could happen if exploited]

**Evidence:**
\`\`\`typescript
// Vulnerable code
\`\`\`

**Remediation:**
[How to fix it with code example]

**References:**
- [OWASP Link]
- [Azure WAF Link]

---

## Compliance Status

### Azure WAF Security Pillar
| Control | Status | Notes |
|---------|--------|-------|
| SE:01 Baseline | ✅/⚠️/❌ | |
| SE:02 SDL | ✅/⚠️/❌ | |
...

### OWASP Top 10:2025
| Category | Status | Notes |
|----------|--------|-------|
| A01 Access Control | ✅/⚠️/❌ | |
| A02 Misconfiguration | ✅/⚠️/❌ | |
...

## Recommendations

1. **Immediate:** [Critical fixes]
2. **Short-term:** [High priority items]
3. **Medium-term:** [Medium priority items]
4. **Long-term:** [Architecture improvements]
```

````