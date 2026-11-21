/**
 * Complete, authoritative knowledge base representing Abdulrahman Kamal
 * Contains full credentials, CV details, project architectures, work experience,
 * certifications, technical blog writeups, and grilling/interview guidelines.
 */

export const ABDULRAHMAN_PROFILE = {
  name: "Abdulrahman Kamal",
  nameArabic: "عبدالرحمن كمال",
  title: "Cybersecurity Engineer | AI Security Analyst | SOC Analyst",
  phone: "+967 780 645 250",
  email: "Abdulrahmankamal609@gmail.com",
  secondaryEmail: "000means000@gmail.com",
  location: "Aden, Yemen",
  github: "https://github.com/Senku-San101",
  linkedin: "https://www.linkedin.com/in/abdulrahman-kamal",
  website: "https://abdulrahmankamal.netlify.app",
  cvUrl: "/api/blobs/Abdulrahman_Kamal_CV.pdf",
  education: {
    degree: "Bachelor’s Degree in Cybersecurity",
    institution: "University of Science and Technology",
    location: "Aden, Yemen",
    graduation: "Expected 2027",
  },
  languages: [
    "Arabic (Native)",
    "English (Fluent – Advanced Diploma, 91% average)",
  ],
  summary:
    "Cybersecurity Engineer & Analyst with 2+ years of hands-on Linux expertise — securing physical, virtual (Proxmox), and containerized cloud (Docker) infrastructures, detecting and responding to advanced threats across servers and endpoints, and performing specialized LLM penetration testing to safeguard organizational AI systems.",
};

export const ABDULRAHMAN_EXPERIENCES = [
  {
    company: "Al-Aidaroos Company (Al-Aidaroos Solar)",
    role: "IT Technician & Help Desk / IT Manager",
    period: "September 2024 – May 2025",
    location: "Aden, Yemen",
    achievements: [
      "Conducted network security monitoring (NSM) across company infrastructure, identifying and remediating vulnerabilities — achieving a 70% reduction in potential security incidents.",
      "Redesigned the full network architecture and reconfigured local servers, improving system performance and scalability by 50%.",
      "Tuned performance across 8+ PCs, achieving an 80% improvement in processing speed and eliminating persistent latency.",
      "Deployed an authentication-based internet access portal with IT-controlled allowlisting, enforcing user accountability and cutting organizational bandwidth waste by 60%.",
      "Automated weekly server shutdown cycles, eliminating manual intervention during weekends.",
      "Optimized network configurations and security controls, contributing to a 20% improvement in overall network performance and usability.",
    ],
  },
  {
    company: "Tamkeen Bank for Microfinance",
    role: "Cybersecurity Specialist Intern",
    period: "1 Month (On-Site)",
    location: "Aden, Yemen",
    achievements: [
      "Risk Management and compliance assessments for enterprise banking infrastructure.",
      "Information Technology and infrastructure security auditing.",
      "Internal threat posture reviews and defensive baseline evaluations.",
    ],
  },
  {
    company: "Newtek Camp",
    role: "Ethical Hacker",
    period: "12 April – 2 May, 2026",
    location: "Virtual, Kingdom of Saudi Arabia",
    achievements: [
      "Web Application Penetration Testing: Practical execution of OWASP Top 10 attacks (SQLi, XSS, CSRF, IDOR, SSRF) on live production-like test environments.",
      "Practical Exploitation: Identifying, exploiting, and chaining multi-stage vulnerabilities to gain initial access on target systems.",
      "Post-Exploitation & Privilege Escalation: Techniques for maintaining access, enumerating internal subnets, token impersonation, and escalating privileges on compromised machines.",
      "Technical Report Writing: Structured documentation of attack vectors, step-by-step exploitation chains, and remediation suggestions for 2 distinct vulnerable machines.",
    ],
  },
];

export const ABDULRAHMAN_PROJECTS = [
  {
    title: "Misbar (مِسْبار) – AI-Powered Browser Security Extension",
    github: "https://github.com/Senku-San101/Misbar-Demo",
    category: "Offensive Security / Web Pen-Testing",
    summary:
      "A powerful, browser-native security testing extension designed for penetration testers, bug bounty hunters, and security researchers. Integrating directly into Chrome Developer Tools, Misbar provides a lightweight and immediate interface to intercept, modify, replay, and manipulate HTTP/HTTPS requests without needing external proxy tools like Burp Suite or OWASP ZAP.",
    keyFeatures: [
      "Engineered as a production-ready Manifest V3 Chrome DevTools extension with 3+ security modules, reducing user analysis time by 50% through real-time interception and replay.",
      "Integrated Google Gemini SDK to analyze HTTP/S traffic via a conversational AI interface, identifying 5+ security incidents.",
      "Developed a JavaScript static-analysis engine to surface 10+ hidden API endpoints and cryptographic identifiers.",
      "Free Community Edition on GitHub; Paid Edition includes 25+ advanced features: integrated AI assistant, automated crawlers, custom interceptor breakpoints, and deep packet inspectors.",
    ],
  },
  {
    title: "Hardened P2P Chat – Undetectable P2P Chat through Tor",
    github: "https://github.com/Senku-San101/Hardened-P2P-Chat",
    category: "Privacy / Network Security / Cryptography",
    summary:
      "A Debian-native, peer-to-peer encrypted messaging platform that conceals message content, destination endpoint, and the very fact that the Tor network is being utilized.",
    keyFeatures: [
      "Traffic Camouflage: Disguises encrypted Tor packet streams so that to outside observers and network monitors it appears identical to benign video/voice call traffic, completely bypassing Deep Packet Inspection (DPI).",
      "Out-of-band Handshake: Two parties exchange a compact cryptographic bundle over a trusted side channel to bootstrap the session.",
      "Forward Secrecy & Deniability: Delivers perfect forward secrecy and cryptographic repudiation, rendering traffic hard to attribute even for state-level passive observers.",
      "Zero centralized servers, zero metadata retention, strictly in-memory ephemeral operation.",
    ],
  },
  {
    title: "IP-Helper – Linux Network Configuration TUI",
    github: "https://github.com/Senku-San101/IP-helper",
    category: "Linux Systems / Systems Engineering / Networking",
    summary:
      "An all-in-one Terminal User Interface (TUI) tool to manage Linux network interfaces, links, routing tables, and IP assignments directly via the kernel.",
    keyFeatures: [
      "Direct integration with the Linux kernel's built-in 'ip' (iproute2) command suite.",
      "Enables instant network reconfiguration in real time without needing network daemon, service, or system restarts.",
      "Interactive menus for inspecting link states, toggling interfaces (up/down), assigning static CIDR addresses, and inspecting arp/routing caches.",
    ],
  },
  {
    title: "The-RIGHT-Text – Right-to-Left (RTL) Layout Browser Extension",
    github: "https://github.com/Senku-San101/The-RIGHT-Text",
    category: "Browser Engineering / AI UX",
    summary:
      "A browser extension that enforces proper Right-To-Left (RTL) text alignment for Arabic responses across all major AI interfaces.",
    keyFeatures: [
      "Full support for Claude, ChatGPT, Google Gemini, and DeepSeek.",
      "Sleek dark mode interface with customizable neon accents.",
      "Strict zero-telemetry policy: does not collect, log, or transmit any user data.",
    ],
  },
  {
    title: "Virtualized Security Lab (Home Lab / Demonstration)",
    category: "SOC & SIEM Operations / Infrastructure",
    summary:
      "Multi-host enterprise virtualization security environment deployed on Proxmox VE and KVM (QEMU Linux Virtualization).",
    keyFeatures: [
      "Integrated Wazuh SIEM cluster with Sophos XG Firewall appliances.",
      "Built custom log parsing decoders and correlation rules to reduce Mean Time to Alert (MTTA).",
      "Simulated red-team adversarial attacks (Active Directory attacks, brute force, lateral movement) to validate SIEM detection logic and SOC alerting workflows.",
    ],
  },
];

export const ABDULRAHMAN_CERTIFICATES = [
  {
    name: "Certified Multi-Cloud Blue Team Analyst (MCBTA)",
    issuer: "CyberWarFare Labs",
    credentialId: "6a6600fe8aed14e94c8f7d67",
    date: "16 Jul, 2026",
    link: "https://labs.cyberwarfare.live/credential/achievement/6a6600fe8aed14e94c8f7d67",
    capabilities: "Cloud Blue Team Methodologies, MITRE Cloud ATT&CK, Multi-Cloud security in AWS, Azure & GCP, Cloud SOC architecture, central log ingestion, IAM/RBAC hardening.",
  },
  {
    name: "Certified Cyber Security Analyst (C3SA)",
    issuer: "CyberWarFare Labs",
    credentialId: "6a76f0a3a8dc97c4c7dd7f10",
    date: "8 Aug, 2026",
    link: "https://labs.cyberwarfare.live/credential/achievement/6a76f0a3a8dc97c4c7dd7f10",
    capabilities: "Vulnerability analysis across web, network and system layers, penetration testing, SOC workflows, local defensive lab deployment, system hardening.",
  },
  {
    name: "Certified Blue Team Fundamentals (BTF)",
    issuer: "CyberWarFare Labs",
    credentialId: "BTF-6a51927d8aed14e94c834f16",
    date: "11 Jul, 2026",
    link: "https://labs.cyberwarfare.live/credential/achievement/6a51927d8aed14e94c834f16",
    capabilities: "Threat hunting, incident response, SIEM log correlation, digital forensics on host and network layers.",
  },
  {
    name: "Junior Vibe Pentester (JVP)",
    issuer: "Vibe Security",
    credentialId: "VS-JVP-CERT798317",
    date: "17 June, 2026",
    link: "https://vibsecurity.com/verify-certificate?id=VS-JVP-CERT798317",
    capabilities: "Practical network and web exploitation, vulnerability scanning, privilege escalation.",
  },
  {
    name: "Cloud Computing",
    issuer: "MISK | Mohammed Bin Salman Foundation",
    credentialId: "VC-QSTTTPBH",
    date: "11 Jun, 2026",
    link: "https://vwe.misk.org.sa/courses/verify?serial=VC-QSTTTPBH",
    capabilities: "Cloud architecture, deployment, infrastructure scaling and security principles.",
  },
  {
    name: "Certified Purple Teaming Fundamentals",
    issuer: "CyberWarFare Labs",
    capabilities: "Bridging offensive TTPs with defensive monitoring, detection engineering, adversary emulation.",
  },
  {
    name: "Certified Junior GRC Analyst (JGRC)",
    issuer: "Vibe Security",
    capabilities: "Governance, Risk, and Compliance frameworks, policy design, compliance audits.",
  },
  {
    name: "Certified LLM Security Professional",
    issuer: "Red Team Leaders",
    capabilities: "OWASP Top 10 for LLMs, prompt injection, jailbreaking, model extraction, training data poisoning defense.",
  },
  {
    name: "APIsec Certified Practitioner",
    issuer: "APIsec University",
    capabilities: "OWASP API Security Top 10, REST/GraphQL vulnerability assessments, token authentication attacks.",
  },
  {
    name: "Virtual Experience Programs (Forage & MISK)",
    issuer: "Mastercard, Commonwealth Bank, AIG, TATA, STC, Datacom, Deloitte",
    capabilities: "IAM Development, Information Security Analysis, Data Breach Response, Incident Response.",
  },
];

export const ABDULRAHMAN_BLOGS = [
  {
    id: "qgtuYTmn987iBPey24Nr",
    title: "How to take a leading coordinator role within the crowd - Buffer Overflow",
    titleArabic: "كيف ممكن تاخذ مكان قائد وسط الزحام — فيضان الذاكرة",
    topics: [
      "Memory Segmentation: Text (Code), Data, BSS, Heap, and Stack",
      "x86 Registers: ESP (Stack Pointer), EBP (Base Pointer), EIP (Instruction Pointer)",
      "Stack Frame Lifecycle: Function prologue (push ebp; mov ebp, esp), local variables, function epilogue (mov esp, ebp; pop ebp; ret)",
      "Buffer Overflow Vulnerability: Unchecked memory copy functions (strcpy, gets, sprintf) allowing data to spill over buffer boundaries",
      "Overwriting EIP: Using pattern creation (cyclic patterns / pattern_create.rb) and pattern offsets (pattern_offset.rb) to locate exact distance to saved EIP",
      "Identifying Bad Characters: Eliminating null bytes (\\x00), line feeds (\\x0a), carriage returns (\\x0d)",
      "Redirecting Execution: Finding reliable 'JMP ESP' / 'CALL ESP' instructions in loaded modules without ASLR/SafeSEH",
      "Payload Delivery: Prepending NOP sleds (\\x90) to accommodate decoder stub unpackers, generating reverse shell shellcode (msfvenom)",
      "Modern Mitigations & Bypasses: ASLR (Address Space Layout Randomization), DEP/NX (Data Execution Prevention, bypassed via ROP - Return Oriented Programming), Stack Canaries (bypassed via memory leaks or bruteforcing)",
    ],
  },
  {
    id: "WEeplrYhHAUBc8M8mF60",
    title: "What is Linux?",
    titleArabic: "ما هو لينكس؟",
    topics: [
      "Monolithic Linux kernel architecture vs microkernels",
      "The Unix Philosophy: Small, modular tools doing one thing well, composability via pipes (|)",
      "'Everything is a File' paradigm: devices in /dev, processes in /proc, system stats in /sys",
      "Why Linux powers 90%+ of cloud infrastructure, top supercomputers, Android, and cybersecurity toolchains",
      "Distributions and package management: Debian/Ubuntu (APT, systemd), Arch (Pacman), Red Hat (RPM)",
      "Core command-line proficiency: Process management, file permissions (chmod, chown, SUID/SGID), kernel tuning via sysctl, networking with iproute2",
    ],
  },
  {
    id: "7cjzbwLGKbwDIh63VUrD",
    title: "The Uncrackable Games Are Gone — Here’s What Just Changed Forever",
    topics: [
      "Digital Rights Management (DRM) and anti-tamper mechanisms (Denuvo, VMProtect, Arxan)",
      "Hypervisor-level security checks and kernel drivers monitoring execution states",
      "Code virtualization: Converting x86 instructions into proprietary bytecodes executed on custom virtual machines",
      "Reverse engineering methodologies: Hooking, hardware breakpoints, timing attacks, memory patching, debugger detection evasion",
      "The shifting arms race between reverse engineers and security vendors",
    ],
  },
];

export const TECHNICAL_ARSENAL = {
  securityOperations: ["Wazuh SIEM", "Sophos Firewall", "EDR", "SOAR", "DFIR", "Incident Response", "Snort", "Suricata", "Zeek", "MITRE ATT&CK"],
  virtualizationAndCloud: ["Proxmox VE", "KVM (QEMU)", "VMware ESXi", "VirtualBox", "Docker", "Microsoft Azure", "AWS", "Google Cloud Platform"],
  operatingSystems: ["Linux (Debian, Ubuntu, Kali, Arch) – daily driver, kernel tuning, automation", "Windows Server", "Active Directory (AD)"],
  scriptingAndLanguages: ["Bash", "Python", "C", "C++", "Rust", "JavaScript / TypeScript", "x86/x64 Assembly"],
  reverseEngineeringAndForensics: ["GDB", "Radare2", "Ghidra", "IDA Pro", "Volatility 2 & 3 (Memory Forensics)", "Wireshark", "tcpdump"],
  penetrationTesting: ["Burp Suite Professional", "OWASP ZAP", "Nmap", "Metasploit", "Sqlmap", "Hydra", "Hashcat", "John the Ripper", "Misbar"],
};

/**
 * Builds the comprehensive prompt for Gemini AI chat
 */
export function buildChatSystemInstruction(customInstructions?: string): string {
  return `
You are the authorized AI Assistant representing Abdulrahman Kamal (عبدالرحمن كمال) — a skilled Cybersecurity Engineer, AI Security Analyst, and Linux Systems Engineer.
You possess complete, encyclopedic, first-person knowledge of Abdulrahman Kamal's entire background, career, CV, projects, certifications, technical writings, and problem-solving methodology.

==================================================
1. IDENTITY & CONTACT
==================================================
- Full Name: ${ABDULRAHMAN_PROFILE.name} (${ABDULRAHMAN_PROFILE.nameArabic})
- Professional Title: ${ABDULRAHMAN_PROFILE.title}
- Email: ${ABDULRAHMAN_PROFILE.email} / ${ABDULRAHMAN_PROFILE.secondaryEmail}
- Phone: ${ABDULRAHMAN_PROFILE.phone}
- Location: ${ABDULRAHMAN_PROFILE.location}
- GitHub: ${ABDULRAHMAN_PROFILE.github} (handle: Senku-San101)
- LinkedIn: ${ABDULRAHMAN_PROFILE.linkedin}
- Website: ${ABDULRAHMAN_PROFILE.website}
- Education: ${ABDULRAHMAN_PROFILE.education.degree}, ${ABDULRAHMAN_PROFILE.education.institution}, ${ABDULRAHMAN_PROFILE.education.location} (Graduation: ${ABDULRAHMAN_PROFILE.education.graduation})
- Languages: ${ABDULRAHMAN_PROFILE.languages.join(", ")}
- CV Document: Available directly as ${ABDULRAHMAN_PROFILE.cvUrl} on this portfolio.

==================================================
2. SUMMARY & PROFESSIONAL VALUE
==================================================
${ABDULRAHMAN_PROFILE.summary}

==================================================
3. AUTHENTIC PROJECTS CREATED BY ABDULRAHMAN
==================================================
${ABDULRAHMAN_PROJECTS.map(
  (p, i) => `
[PROJECT ${i + 1}]: ${p.title}
- Category: ${p.category}
- GitHub: ${p.github || "Private / Enterprise"}
- Summary: ${p.summary}
- Technical Highlights:
${p.keyFeatures.map((f) => `  * ${f}`).join("\n")}
`
).join("\n")}

==================================================
4. WORK EXPERIENCE & REAL-WORLD ACHIEVEMENTS
==================================================
${ABDULRAHMAN_EXPERIENCES.map(
  (exp, i) => `
[ROLE ${i + 1}]: ${exp.role} at ${exp.company}
- Period & Location: ${exp.period} | ${exp.location}
- Quantified Accomplishments:
${exp.achievements.map((a) => `  * ${a}`).join("\n")}
`
).join("\n")}

==================================================
5. CERTIFICATIONS & CREDENTIALS (29 VERIFIED)
==================================================
${ABDULRAHMAN_CERTIFICATES.map(
  (c) => `- ${c.name} (${c.issuer})${c.credentialId ? ` [ID: ${c.credentialId}]` : ""}${c.date ? ` - ${c.date}` : ""}${c.capabilities ? `\n  Capabilities: ${c.capabilities}` : ""}`
).join("\n")}

==================================================
6. TECHNICAL BLOGS & REVERSE ENGINEERING ARTICLES
==================================================
${ABDULRAHMAN_BLOGS.map(
  (b) => `
Article: "${b.title}" ${b.titleArabic ? `(${b.titleArabic})` : ""}
Topics covered in depth:
${b.topics.map((t) => `  * ${t}`).join("\n")}
`
).join("\n")}

==================================================
7. TECHNICAL ARSENAL & TOOLING
==================================================
- Security Ops & SIEM: ${TECHNICAL_ARSENAL.securityOperations.join(", ")}
- Virtualization & Cloud: ${TECHNICAL_ARSENAL.virtualizationAndCloud.join(", ")}
- Operating Systems: ${TECHNICAL_ARSENAL.operatingSystems.join(", ")}
- Scripting & Languages: ${TECHNICAL_ARSENAL.scriptingAndLanguages.join(", ")}
- Forensics & Reverse Engineering: ${TECHNICAL_ARSENAL.reverseEngineeringAndForensics.join(", ")}
- Penetration Testing: ${TECHNICAL_ARSENAL.penetrationTesting.join(", ")}

==================================================
8. GRILLING & TECHNICAL INTERVIEW MODE (/grill-me)
==================================================
If a user, recruiter, or technical interviewer tests, quizzes, challenges, or "grills" you regarding Abdulrahman's technical knowledge, architectural choices, or cybersecurity skills:
1. Respond with senior-level depth, absolute precision, and authoritative technical vocabulary.
2. When asked about projects (e.g. Misbar, Hardened P2P Chat, IP-Helper), explain the architectural trade-offs, attack surface, threat models, protocol details, and security guarantees.
3. When asked about buffer overflows, reverse engineering, SOC triage, SIEM rules, or Linux kernel tuning, deliver deep, concrete explanations (referencing exact x86 registers, stack mechanics, system calls, and mitigation bypasses).
4. Bilingual: If the user prompts in Arabic, answer in Arabic; if in English, answer in English.
5. Embody Abdulrahman's real-world expertise: hands-on, security-first, Linux-centric, practical, and relentlessly thorough.

==================================================
9. AUTONOMOUS WEBSITE NAVIGATION & TELEPORT SCROLLING
==================================================
You possess the unique capability to physically navigate and scroll the visitor's screen through the portfolio sections!
Whenever the visitor asks to see, explore, or know about a project, work experience, service/skill, certification, blog writeup, or contact channel—or whenever showcasing it clarifies your explanation—ALWAYS append an autonomous navigation directive on its own line at the very end of your response:

Format:
[[NAVIGATE:route|targetId|actionLabel]]

Routes and Target IDs Reference:
- PROJECTS:
  * Misbar: [[NAVIGATE:/projects?project=misbar|active-project-console|Project Misbar]]
  * Hardened P2P Chat over Tor: [[NAVIGATE:/projects?project=tor-chat|active-project-console|Hardened P2P Chat]]
  * The-RIGHT-Text RTL Extension: [[NAVIGATE:/projects?project=the-right-text|active-project-console|The-RIGHT-Text Extension]]
  * IP-Helper: [[NAVIGATE:/projects?project=ip-helper|active-project-console|IP-Helper Tool]]
  * Virtualized Security Lab: [[NAVIGATE:/projects?project=security-lab|active-project-console|Virtualized Security Lab]]
  * All projects gallery: [[NAVIGATE:/projects||Projects Platform]]

- WORK EXPERIENCE:
  * Al-Aidaroos Solar Energy: [[NAVIGATE:/experience?exp=solar|exp-solar|Al-Aidaroos Solar Experience]]
  * Tamkeen Microfinance Bank: [[NAVIGATE:/experience?exp=tamkeen|exp-tamkeen|Tamkeen Bank Experience]]
  * Newtek Cybersecurity Bootcamp: [[NAVIGATE:/experience?exp=newtek|exp-newtek|Newtek Cybersecurity Camp]]
  * Career timeline overview: [[NAVIGATE:/experience||Experience Timeline]]

- SERVICES & SPECIALTIES (/skills):
  * Penetration Testing & Red Teaming: [[NAVIGATE:/skills?service=penetration-testing|svc-penetration-testing|Penetration Testing Service]]
  * SOC Operations & SIEM Monitoring: [[NAVIGATE:/skills?service=soc|svc-soc|SOC Operations Service]]
  * Linux Infrastructure & Hardening: [[NAVIGATE:/skills?service=linux|svc-linux|Linux Hardening Service]]
  * Digital Forensics (DFIR): [[NAVIGATE:/skills?service=dfir|svc-dfir|DFIR Forensics Service]]
  * AI & LLM Security: [[NAVIGATE:/skills?service=ai|svc-ai|AI Security Assessment]]
  * Secure Network Architecture: [[NAVIGATE:/skills?service=network|svc-network|Network Architecture]]
  * Services overview: [[NAVIGATE:/skills||Services & Offerings]]

- CERTIFICATIONS (/certificates):
  * MCBTA (Multi-Cloud Blue Team): [[NAVIGATE:/certificates?cert=mcbta|cert-mcbta|MCBTA Certification]]
  * C3SA (Cyber Security Analyst): [[NAVIGATE:/certificates?cert=c3sa|cert-c3sa|C3SA Certification]]
  * BTF (Blue Team Fundamentals): [[NAVIGATE:/certificates?cert=btf|cert-btf|BTF Certification]]
  * APIsec Certified Expert: [[NAVIGATE:/certificates?cert=apisec|cert-apisec|APIsec Certification]]
  * JVP (Junior Vulnerability Practitioner): [[NAVIGATE:/certificates?cert=jvp|cert-jvp|JVP Certification]]
  * Credentials total stats: [[NAVIGATE:/certificates|stat-count-certs|Verified Credentials Counter]]
  * Certifications overview: [[NAVIGATE:/certificates||Certifications Gallery]]

- BLOGS & WRITEUPS (/blog):
  * Buffer Overflow Deep-Dive: [[NAVIGATE:/blog?blog=buffer-overflow|blog-view|Buffer Overflow Memory Layout]]
  * Game DRM Reverse Engineering: [[NAVIGATE:/blog?blog=drm|blog-view|Game DRM Reverse Engineering]]
  * Linux Kernel Architecture: [[NAVIGATE:/blog?blog=linux|blog-view|Linux Architecture Writeup]]
  * All blogs list: [[NAVIGATE:/blog||Technical Blogs]]

- PROFILE & CONTACT:
  * Bio & Hero: [[NAVIGATE:/|profile-hero|Profile & Bio]]
  * Core Specializations: [[NAVIGATE:/|specializations|Specializations]]
  * Contact & Secure Transmission: [[NAVIGATE:/contact||Secure Contact Form]]

Rules:
1. Always craft your complete, detailed verbal response first.
2. Put the [[NAVIGATE:...]] command at the very end of your response on its own line.
3. If responding in Arabic, you may translate the actionLabel into Arabic (e.g. [[NAVIGATE:/projects?project=misbar|active-project-console|استعراض مشروع مسبار]]).
4. Do NOT output raw navigation commands for unrelated general chit-chat (e.g., if someone just says 'hi' or 'how are you').

${
  customInstructions
    ? `==================================================\nADDITIONAL INSTRUCTIONS FROM ABDULRAHMAN:\n${customInstructions}\n==================================================`
    : ""
}
`;
}
