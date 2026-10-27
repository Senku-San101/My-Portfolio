import { HeaderAuditItem, HeaderAuditResult } from '../types';

export function generateConfigSnippet(server: 'nginx' | 'apache' | 'caddy', missingHeaders?: string[]): string {
  if (server === 'nginx') {
    return `# Nginx Hardening Configuration (/etc/nginx/conf.d/security.conf)
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https:; frame-ancestors 'none';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
server_tokens off;`;
  }

  if (server === 'apache') {
    return `# Apache Hardened Headers (.htaccess or <VirtualHost>)
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:;"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
  Header unset X-Powered-By
</IfModule>
ServerSignature Off
ServerTokens Prod`;
  }

  return `# Caddyfile Hardening Directives
header {
  Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:;"
  Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  X-Frame-Options "DENY"
  X-Content-Type-Options "nosniff"
  Referrer-Policy "strict-origin-when-cross-origin"
  Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
  -Server
  -X-Powered-By
}`;
}

export function analyzeSecurityHeaders(
  headers: Record<string, string>, 
  targetUrl: string, 
  statusCode = 200, 
  responseTimeMs = 120
): HeaderAuditResult {
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    normalized[k.toLowerCase()] = v;
  }

  let score = 0;
  const analysis: HeaderAuditItem[] = [];
  const configuredHeaders: string[] = [];
  const missingHeaders: string[] = [];

  // 1. Content-Security-Policy
  const csp = normalized['content-security-policy'];
  if (csp) {
    configuredHeaders.push('Content-Security-Policy');
    const isWeak = csp.includes("'unsafe-inline'") || csp.includes('*');
    if (isWeak) {
      score += 15;
      analysis.push({
        header: 'Content-Security-Policy',
        present: true,
        configured: true,
        value: csp,
        status: 'warning',
        severity: 'medium',
        description: 'CSP is present, but permits unsafe-inline scripts or wildcards (*).',
        recommendation: "Replace 'unsafe-inline' with nonce or hash-based allowlisting.",
        exampleValue: "default-src 'self'; script-src 'self' 'nonce-...' https:;",
      });
    } else {
      score += 25;
      analysis.push({
        header: 'Content-Security-Policy',
        present: true,
        configured: true,
        value: csp,
        status: 'good',
        severity: 'low',
        description: 'Strong Content Security Policy enforced to mitigate Cross-Site Scripting (XSS).',
      });
    }
  } else {
    missingHeaders.push('Content-Security-Policy');
    analysis.push({
      header: 'Content-Security-Policy',
      present: false,
      configured: false,
      status: 'critical',
      severity: 'critical',
      description: 'Missing CSP header! Leaves the application vulnerable to XSS and unauthorized resource inclusion.',
      recommendation: "Define a strict Content-Security-Policy header restricts source origins.",
      exampleValue: "default-src 'self'; script-src 'self'; object-src 'none';",
    });
  }

  // 2. Strict-Transport-Security (HSTS)
  const hsts = normalized['strict-transport-security'];
  if (hsts) {
    configuredHeaders.push('Strict-Transport-Security');
    const hasLongAge = hsts.includes('max-age=31536000') || hsts.includes('max-age=63072000');
    const hasSubdomains = hsts.includes('includesubdomains');
    if (hasLongAge && hasSubdomains) {
      score += 20;
      analysis.push({
        header: 'Strict-Transport-Security',
        present: true,
        configured: true,
        value: hsts,
        status: 'good',
        severity: 'low',
        description: 'Optimal HSTS configured for >= 1 year with includeSubDomains.',
      });
    } else {
      score += 12;
      analysis.push({
        header: 'Strict-Transport-Security',
        present: true,
        configured: true,
        value: hsts,
        status: 'warning',
        severity: 'medium',
        description: 'HSTS is present, but consider max-age >= 31536000 and includeSubDomains.',
        recommendation: "Configure 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload'.",
      });
    }
  } else {
    missingHeaders.push('Strict-Transport-Security');
    analysis.push({
      header: 'Strict-Transport-Security',
      present: false,
      configured: false,
      status: 'critical',
      severity: 'critical',
      description: 'Missing HSTS! Connections can be intercepted or downgraded to unencrypted HTTP.',
      recommendation: "Set Strict-Transport-Security with max-age >= 31536000 and includeSubDomains.",
      exampleValue: "max-age=31536000; includeSubDomains; preload",
    });
  }

  // 3. X-Frame-Options (Clickjacking defense)
  const xfo = normalized['x-frame-options'];
  if (xfo) {
    configuredHeaders.push('X-Frame-Options');
    score += 15;
    analysis.push({
      header: 'X-Frame-Options',
      present: true,
      configured: true,
      value: xfo,
      status: 'good',
      severity: 'low',
      description: `Protects against Clickjacking framing attacks (${xfo}).`,
    });
  } else {
    missingHeaders.push('X-Frame-Options');
    analysis.push({
      header: 'X-Frame-Options',
      present: false,
      configured: false,
      status: 'critical',
      severity: 'high',
      description: 'Missing X-Frame-Options! Page can be framed inside attacker iframes for Clickjacking.',
      recommendation: "Set 'X-Frame-Options: DENY' or 'SAMEORIGIN'.",
      exampleValue: 'DENY',
    });
  }

  // 4. X-Content-Type-Options
  const xcto = normalized['x-content-type-options'];
  if (xcto && xcto.toLowerCase().includes('nosniff')) {
    configuredHeaders.push('X-Content-Type-Options');
    score += 15;
    analysis.push({
      header: 'X-Content-Type-Options',
      present: true,
      configured: true,
      value: xcto,
      status: 'good',
      severity: 'low',
      description: 'MIME-type sniffing disabled. Prevents browsers from interpreting files as executable scripts.',
    });
  } else {
    missingHeaders.push('X-Content-Type-Options');
    analysis.push({
      header: 'X-Content-Type-Options',
      present: false,
      configured: false,
      status: 'critical',
      severity: 'high',
      description: 'Missing X-Content-Type-Options! Allows browsers to MIME-sniff response payloads into executable types.',
      recommendation: "Set 'X-Content-Type-Options: nosniff'.",
      exampleValue: 'nosniff',
    });
  }

  // 5. Referrer-Policy
  const refPolicy = normalized['referrer-policy'];
  if (refPolicy) {
    configuredHeaders.push('Referrer-Policy');
    score += 10;
    analysis.push({
      header: 'Referrer-Policy',
      present: true,
      configured: true,
      value: refPolicy,
      status: 'good',
      severity: 'low',
      description: `Controls referrer data leakage across origins (${refPolicy}).`,
    });
  } else {
    missingHeaders.push('Referrer-Policy');
    analysis.push({
      header: 'Referrer-Policy',
      present: false,
      configured: false,
      status: 'warning',
      severity: 'medium',
      description: 'Missing Referrer-Policy header. Browsers may leak sensitive URL tokens in HTTP Referer headers.',
      recommendation: "Set 'Referrer-Policy: strict-origin-when-cross-origin'.",
      exampleValue: 'strict-origin-when-cross-origin',
    });
  }

  // 6. Permissions-Policy
  const permPolicy = normalized['permissions-policy'] || normalized['feature-policy'];
  if (permPolicy) {
    configuredHeaders.push('Permissions-Policy');
    score += 15;
    analysis.push({
      header: 'Permissions-Policy',
      present: true,
      configured: true,
      value: permPolicy,
      status: 'good',
      severity: 'low',
      description: 'Hardware feature and API delegations are explicitly restricted.',
    });
  } else {
    missingHeaders.push('Permissions-Policy');
    analysis.push({
      header: 'Permissions-Policy',
      present: false,
      configured: false,
      status: 'warning',
      severity: 'medium',
      description: 'Missing Permissions-Policy. Browser hardware features (camera, mic, geolocation) are unmanaged.',
      recommendation: "Add 'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()'.",
      exampleValue: 'camera=(), microphone=(), geolocation=(), payment=()',
    });
  }

  // Information Leakage Checks
  const serverHeader = normalized['server'];
  const poweredBy = normalized['x-powered-by'] || normalized['x-aspnet-version'] || normalized['x-runtime'];
  const hasLeak = Boolean(poweredBy || (serverHeader && /\d+\.\d+/.test(serverHeader)));

  if (serverHeader) {
    analysis.push({
      header: 'Server (Information Leak)',
      present: true,
      configured: true,
      value: serverHeader,
      status: hasLeak ? 'warning' : 'info',
      severity: hasLeak ? 'medium' : 'low',
      description: hasLeak 
        ? `Exposes server software details: ${serverHeader}. Attackers use this to identify known CVEs.` 
        : `Server identifier present: ${serverHeader}.`,
      recommendation: 'Conceal or genericize the Server banner (e.g. server_tokens off in Nginx).',
    });
    if (hasLeak) score = Math.max(0, score - 5);
  }

  if (poweredBy) {
    analysis.push({
      header: 'X-Powered-By (Information Leak)',
      present: true,
      configured: true,
      value: poweredBy,
      status: 'warning',
      severity: 'medium',
      description: `Exposes backend runtime / framework: ${poweredBy}. Facilitates targeted exploit research.`,
      recommendation: 'Strip X-Powered-By header from backend configuration.',
    });
    score = Math.max(0, score - 5);
  }

  // Calculate Grade
  let grade: HeaderAuditResult['grade'] = 'F';
  if (score >= 90) {
    grade = (csp && hsts) ? 'A+' : 'A';
  } else if (score >= 75) {
    grade = 'B';
  } else if (score >= 60) {
    grade = 'C';
  } else if (score >= 45) {
    grade = 'D';
  } else {
    grade = 'F';
  }

  let statusDescription = 'Critical Vulnerabilities Detected';
  if (score >= 90) statusDescription = 'Elite Defensive Posture';
  else if (score >= 75) statusDescription = 'Good Defense - Minor Hardening Recommended';
  else if (score >= 50) statusDescription = 'Moderate Gaps - Important Headers Missing';

  return {
    url: targetUrl,
    targetUrl,
    timestamp: new Date().toISOString(),
    score: Math.min(100, Math.max(0, score)),
    grade,
    statusDescription,
    statusCode,
    responseTimeMs,
    headers: normalized,
    analysis,
    items: analysis,
    configuredHeaders,
    missingHeaders,
    serverLeaks: {
      server: serverHeader,
      poweredBy,
      detected: hasLeak,
    },
    infoLeakage: {
      server: serverHeader,
      poweredBy,
      hasLeak,
    },
    recommendedSnippets: {
      nginx: generateConfigSnippet('nginx', missingHeaders),
      apache: generateConfigSnippet('apache', missingHeaders),
      caddy: generateConfigSnippet('caddy', missingHeaders),
    },
  };
}
