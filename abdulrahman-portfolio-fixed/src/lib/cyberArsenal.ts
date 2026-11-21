import { VaultItem } from '../types';

// ==========================================
// 1. CIDR & IPv4 Subnet Calculator Math
// ==========================================

export interface SubnetCalcResult {
  ip: string;
  cidr: number;
  netmask: string;
  wildcard: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalHosts: number;
  usableHosts: number;
  ipBinary: string;
  maskBinary: string;
  ipClass: string;
  isPrivate: boolean;
  subnetsSplit?: { cidr: number; network: string; usableRange: string; count: number }[];
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join('.');
}

function longToBinary(long: number): string {
  return [
    ((long >>> 24) & 255).toString(2).padStart(8, '0'),
    ((long >>> 16) & 255).toString(2).padStart(8, '0'),
    ((long >>> 8) & 255).toString(2).padStart(8, '0'),
    (long & 255).toString(2).padStart(8, '0'),
  ].join('.');
}

export function calculateSubnet(input: string): SubnetCalcResult | null {
  try {
    const parts = input.trim().split('/');
    const ipStr = parts[0].trim();
    const cidrStr = parts[1] ? parts[1].trim() : '24';
    const cidr = parseInt(cidrStr, 10);

    if (isNaN(cidr) || cidr < 0 || cidr > 32) return null;

    const octets = ipStr.split('.');
    if (octets.length !== 4) return null;
    for (const oct of octets) {
      const num = parseInt(oct, 10);
      if (isNaN(num) || num < 0 || num > 255) return null;
    }

    const ipLong = ipToLong(ipStr);
    const maskLong = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const wildcardLong = ~maskLong >>> 0;

    const netLong = (ipLong & maskLong) >>> 0;
    const bcastLong = (netLong | wildcardLong) >>> 0;

    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

    const firstUsable = cidr >= 31 ? netLong : netLong + 1;
    const lastUsable = cidr >= 31 ? bcastLong : bcastLong - 1;

    // Determine Network Class
    const firstOctet = parseInt(octets[0], 10);
    let ipClass = 'Class A';
    if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Class B';
    else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'Class C';
    else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'Class D (Multicast)';
    else if (firstOctet >= 240) ipClass = 'Class E (Reserved)';

    // Private vs Public check
    const isPrivate =
      (firstOctet === 10) ||
      (firstOctet === 172 && parseInt(octets[1], 10) >= 16 && parseInt(octets[1], 10) <= 31) ||
      (firstOctet === 192 && parseInt(octets[1], 10) === 168) ||
      (firstOctet === 127);

    // Subnet splitting matrix (e.g., if /24, split into two /25s)
    const subnetsSplit = [];
    if (cidr <= 29) {
      const splitCidr = cidr + 1;
      const subBlockSize = Math.pow(2, 32 - splitCidr);
      for (let i = 0; i < 2; i++) {
        const subNet = netLong + (i * subBlockSize);
        const subBcast = subNet + subBlockSize - 1;
        subnetsSplit.push({
          cidr: splitCidr,
          network: `${longToIp(subNet)}/${splitCidr}`,
          usableRange: `${longToIp(subNet + 1)} - ${longToIp(subBcast - 1)}`,
          count: subBlockSize - 2,
        });
      }
    }

    return {
      ip: ipStr,
      cidr,
      netmask: longToIp(maskLong),
      wildcard: longToIp(wildcardLong),
      networkAddress: longToIp(netLong),
      broadcastAddress: longToIp(bcastLong),
      firstUsableIp: longToIp(firstUsable),
      lastUsableIp: longToIp(lastUsable),
      totalHosts,
      usableHosts,
      ipBinary: longToBinary(ipLong),
      maskBinary: longToBinary(maskLong),
      ipClass,
      isPrivate,
      subnetsSplit,
    };
  } catch {
    return null;
  }
}

// ==========================================
// 2. Multi-Format Encoders, Decoders & JWT
// ==========================================

export function utf8ToBase64(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  } catch {
    return btoa(str);
  }
}

export function base64ToUtf8(b64: string): string {
  try {
    const raw = atob(b64.trim().replace(/\s+/g, ''));
    return decodeURIComponent(raw.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (err: any) {
    throw new Error('Invalid Base64 payload: ' + err.message);
  }
}

export function asciiToHex(str: string, delimiter = ' '): string {
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(delimiter);
}

export function hexToAscii(hexStr: string): string {
  const clean = hexStr.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) throw new Error('Hex string length must be an even number');
  let output = '';
  for (let i = 0; i < clean.length; i += 2) {
    output += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
  }
  return output;
}

export interface ParsedJwt {
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  isExpired: boolean;
  issuedAt?: string;
  expiresAt?: string;
  algorithm?: string;
}

export function parseJwt(jwtToken: string): ParsedJwt | null {
  try {
    const parts = jwtToken.trim().split('.');
    if (parts.length < 2) return null;

    const decodePart = (b64url: string) => {
      let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      return JSON.parse(base64ToUtf8(b64));
    };

    const header = decodePart(parts[0]);
    const payload = decodePart(parts[1]);
    const signature = parts[2] || '';

    let isExpired = false;
    let expiresAt: string | undefined;
    let issuedAt: string | undefined;

    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      isExpired = expDate.getTime() < Date.now();
      expiresAt = expDate.toLocaleString();
    }

    if (payload.iat) {
      issuedAt = new Date(payload.iat * 1000).toLocaleString();
    }

    return {
      header,
      payload,
      signature,
      isExpired,
      issuedAt,
      expiresAt,
      algorithm: header.alg || 'Unknown',
    };
  } catch {
    return null;
  }
}

// ==========================================
// 3. Cryptographic Hashes (Client-Side)
// ==========================================

export async function computeHash(text: string, algorithm: 'SHA-256' | 'SHA-512' | 'SHA-1'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Lightweight pure JS MD5 for quick integrity checks
export function computeMd5(string: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function add32(a: number, b: number) {
    return (a + b) & 0xffffffff;
  }

  const n = string.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let i;
  for (i = 64; i <= n; i += 64) {
    md5cycle(state, md5blk(string.substring(i - 64, i)));
  }
  const tail = string.substring(i - 64);
  const tailBytes = [];
  for (let j = 0; j < tail.length; j++) tailBytes[j] = tail.charCodeAt(j);
  tailBytes[tail.length] = 0x80;
  while (tailBytes.length % 64 !== 56) tailBytes.push(0);
  const tailWords = [];
  for (let j = 0; j < tailBytes.length; j += 4) {
    tailWords.push(tailBytes[j] | (tailBytes[j + 1] << 8) | (tailBytes[j + 2] << 16) | (tailBytes[j + 3] << 24));
  }
  tailWords.push((n * 8) & 0xffffffff);
  tailWords.push(Math.floor((n * 8) / 0x100000000));
  md5cycle(state, tailWords);

  return state.map(w => {
    let s = '';
    for (let b = 0; b < 4; b++) {
      s += ((w >>> (b * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return s;
  }).join('');

  function md5blk(s: string) {
    const md5blks: number[] = [];
    for (let j = 0; j < 64; j += 4) {
      md5blks[j >> 2] = s.charCodeAt(j) + (s.charCodeAt(j + 1) << 8) + (s.charCodeAt(j + 2) << 16) + (s.charCodeAt(j + 3) << 24);
    }
    return md5blks;
  }
}

export function identifyHashType(hashStr: string): string[] {
  const clean = hashStr.trim();
  const hex = clean.replace(/[^0-9a-fA-F]/g, '');
  const len = hex.length;
  const candidates: string[] = [];

  if (clean.startsWith('$2a$') || clean.startsWith('$2b$') || clean.startsWith('$2y$')) {
    candidates.push('Bcrypt Password Hash (Blowfish)');
  }
  if (clean.startsWith('$argon2id$') || clean.startsWith('$argon2i$')) {
    candidates.push('Argon2 Password Hash');
  }
  if (clean.startsWith('$6$')) {
    candidates.push('SHA-512 Crypt (Unix)');
  }

  if (len === 32) {
    candidates.push('MD5 (128-bit)', 'NTLM (Windows Security)');
  } else if (len === 40) {
    candidates.push('SHA-1 (160-bit)', 'RIPEMD-160');
  } else if (len === 56) {
    candidates.push('SHA-224');
  } else if (len === 64) {
    candidates.push('SHA-256 (256-bit)', 'HMAC-SHA256');
  } else if (len === 96) {
    candidates.push('SHA-384');
  } else if (len === 128) {
    candidates.push('SHA-512 (512-bit)', 'Whirlpool');
  }

  return candidates.length > 0 ? candidates : ['Unknown or custom hash format'];
}

// ==========================================
// 4. Pre-Seeded Cybersecurity Command Vault
// ==========================================

export const DEFAULT_VAULT_ITEMS: VaultItem[] = [
  {
    title: 'GDB-PEDA / GEF: Stack Frame & Memory Offset Triage',
    category: 'reversing',
    command: 'gdb -q ./target_binary -ex "break *main" -ex "run" -ex "checksec" -ex "pattern create 250"',
    explanation: 'Initializes GDB in quiet mode, evaluates active security mitigations (NX, PIE, Canary, ASLR) via checksec, and generates a cyclic de Bruijn pattern to calculate exact EIP/RIP overwrite distance.',
    tags: ['gdb', 'buffer-overflow', 'x86_64', 'checksec', 'reversing'],
    isPublic: true,
    order: 0,
  },
  {
    title: 'Wazuh SIEM: Custom Log Decoder & Rule Debugging Engine',
    category: 'soc',
    command: '/var/ossec/bin/wazuh-logtest',
    explanation: 'Launches interactive Wazuh logtest console to paste real-world log lines (syslog, web access, auth.log) and test custom regex decoders and parent rule triggers before deploying to production.',
    tags: ['wazuh', 'siem', 'soc', 'decoders', 'detection-engineering'],
    isPublic: true,
    order: 1,
  },
  {
    title: 'Volatility 3: Malicious Code Injection & Process Memory Scan',
    category: 'soc',
    command: 'vol -f memory.raw windows.malfind --dump',
    explanation: 'Scans virtual memory pages for memory regions with PAGE_EXECUTE_READWRITE permissions and unmapped VAD nodes, dumping injected DLLs and shellcode for reverse engineering.',
    tags: ['volatility', 'dfir', 'memory-forensics', 'malfind'],
    isPublic: true,
    order: 2,
  },
  {
    title: 'Linux Kernel Zero-Trust Hardening & ASLR Randomization',
    category: 'linux',
    command: 'sudo sysctl -w kernel.randomize_va_space=2 && sudo sysctl -w net.ipv4.tcp_syncookies=1 && sudo sysctl -w net.ipv4.conf.all.rp_filter=1',
    explanation: 'Enforces full ASLR (stack, VDSO, shared memory, and mmap base randomization), enables TCP SYN cookies against volumetric SYN floods, and activates strict reverse-path spoofing filters.',
    tags: ['linux', 'kernel', 'hardening', 'sysctl', 'aslr'],
    isPublic: true,
    order: 3,
  },
  {
    title: 'Nftables: High-Performance SYN Flood Rate Limiting',
    category: 'network',
    command: 'sudo nft add rule inet filter input tcp flags syn tcp dport { 80, 443 } meter syn_flood { ip saddr limit rate over 25/second } drop',
    explanation: 'Hardware-efficient nftables dynamic rate meter dropping volumetric SYN floods on HTTPS/HTTP ports when single source IPs exceed 25 SYNs/sec.',
    tags: ['nftables', 'firewall', 'dos-mitigation', 'network-security'],
    isPublic: true,
    order: 4,
  },
  {
    title: 'Nmap Tactical Vulnerability Assessment & Service Enumeration',
    category: 'network',
    command: 'nmap -sS -sV -T4 -p- --min-rate 1000 --script "vuln and safe" -oN nmap_tactical.log <TARGET_IP>',
    explanation: 'Performs full TCP SYN port discovery with service versioning while executing curated, safe vulnerability discovery scripts and outputting formatted results to log.',
    tags: ['nmap', 'recon', 'port-scanning', 'penetration-testing'],
    isPublic: true,
    order: 5,
  },
  {
    title: 'Tor Onion Service: Ephemeral P2P Hidden Service Tunnel',
    category: 'network',
    command: 'tor --HiddenServiceDir /var/lib/tor/secure_node/ --HiddenServicePort 8000 127.0.0.1:8000',
    explanation: 'Launches localized Tor service directory, generating an onion hostname and forwarding encrypted, rendezvous-routed traffic directly to a local hardened service without public IP exposure.',
    tags: ['tor', 'onion', 'p2p-chat', 'covert-channels', 'anonymity'],
    isPublic: true,
    order: 6,
  },
  {
    title: 'OpenSSL TLS 1.3 & Cipher Suite Inspection Probe',
    category: 'web',
    command: 'openssl s_client -connect <TARGET_DOMAIN>:443 -tls1_3 -brief',
    explanation: 'Validates server-side TLS 1.3 negotiation, ALPN protocols, certificate validity chain, and cipher suite support while stripping verbose certificate blobs.',
    tags: ['openssl', 'tls', 'ssl', 'cipher-suites', 'web-security'],
    isPublic: true,
    order: 7,
  },
  {
    title: 'GDB Memory Register & Stack Pointer Dumping',
    category: 'reversing',
    command: 'gdb ./binary -ex "info registers" -ex "x/32wx $esp" -ex "disas main"',
    explanation: 'Inspects CPU general-purpose registers, prints 32 hexadecimal words starting from stack pointer ($esp/$rsp), and disassembles the main subroutine into assembly instructions.',
    tags: ['gdb', 'assembly', 'registers', 'stack-pointer', 'reversing'],
    isPublic: true,
    order: 8,
  },
  {
    title: 'Linux Auditd: Monitor Critical System File Modifications',
    category: 'linux',
    command: 'sudo auditctl -w /etc/passwd -p wa -k identity_tampering && sudo auditctl -w /etc/shadow -p wa -k shadow_tampering',
    explanation: 'Installs non-bypassable Linux kernel audit rules tracking any write or attribute alterations on identity databases with dedicated telemetry keys.',
    tags: ['auditd', 'linux', 'siem', 'file-integrity', 'soc'],
    isPublic: true,
    order: 9,
  },
];
