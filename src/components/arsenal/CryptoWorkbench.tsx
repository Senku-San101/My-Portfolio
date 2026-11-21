import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Code2, Hash, Search, Key, Sparkles, Copy, Check } from 'lucide-react';
import { 
  utf8ToBase64, asciiToHex, parseJwt, computeHash, computeMd5, identifyHashType 
} from '../../lib/cyberArsenal';

export default function CryptoWorkbench({ isAr = false }: { isAr?: boolean }) {
  const [textInput, setTextInput] = useState('CyberSec_Engineer_2026');
  const [base64Out, setBase64Out] = useState('');
  const [hexOut, setHexOut] = useState('');
  const [urlOut, setUrlOut] = useState('');
  
  // Hashing states
  const [md5Hash, setMd5Hash] = useState('');
  const [sha1Hash, setSha1Hash] = useState('');
  const [sha256Hash, setSha256Hash] = useState('');
  const [sha512Hash, setSha512Hash] = useState('');

  // JWT Inspector states
  const [jwtInput, setJwtInput] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmR1bHJhaG1hbiIsImFkbWluIjp0cnVlLCJleHAiOjE4OTM0NTYwMDAsImlhdCI6MTcwMDAwMDAwMH0.signature');
  const [jwtParsed, setJwtParsed] = useState<any>(null);

  // Hash identifier state
  const [hashToIdentify, setHashToIdentify] = useState('');
  const [identifiedHashType, setIdentifiedHashType] = useState<string[] | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Real-time recalculation
  useEffect(() => {
    setBase64Out(utf8ToBase64(textInput));
    setHexOut(asciiToHex(textInput));
    try {
      setUrlOut(encodeURIComponent(textInput));
    } catch {
      setUrlOut('');
    }

    setMd5Hash(computeMd5(textInput));
    computeHash(textInput, 'SHA-1').then(setSha1Hash);
    computeHash(textInput, 'SHA-256').then(setSha256Hash);
    computeHash(textInput, 'SHA-512').then(setSha512Hash);
  }, [textInput]);

  useEffect(() => {
    const res = parseJwt(jwtInput);
    setJwtParsed(res);
  }, [jwtInput]);

  useEffect(() => {
    if (!hashToIdentify.trim()) {
      setIdentifiedHashType(null);
    } else {
      setIdentifiedHashType(identifyHashType(hashToIdentify));
    }
  }, [hashToIdentify]);

  const copyVal = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Text Input Workbench */}
      <div className="glass-md p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>{isAr ? 'محول التنسيقات الفوري (Base64 / Hex / URL)' : 'Real-Time Encoding & Decoding Engine'}</span>
          </h3>
          <span className="text-xs font-mono text-gray-500">{textInput.length} chars</span>
        </div>

        <textarea
          rows={3}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type or paste plain text, base64 or raw string here..."
          className="w-full p-4 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500 resize-none"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Base64 */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-blue-400 font-bold">Base64</span>
              <button onClick={() => copyVal('b64', base64Out)} className="p-1 hover:text-white">
                {copiedKey === 'b64' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="p-2 bg-black/60 rounded text-gray-200 break-all select-all min-h-[44px]">
              {base64Out || '—'}
            </div>
          </div>

          {/* Hex */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-purple-400 font-bold">Hex (Hexadecimal)</span>
              <button onClick={() => copyVal('hex', hexOut)} className="p-1 hover:text-white">
                {copiedKey === 'hex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="p-2 bg-black/60 rounded text-gray-200 break-all select-all min-h-[44px]">
              {hexOut || '—'}
            </div>
          </div>

          {/* URL Encoded */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-emerald-400 font-bold">URL Encoded</span>
              <button onClick={() => copyVal('url', urlOut)} className="p-1 hover:text-white">
                {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="p-2 bg-black/60 rounded text-gray-200 break-all select-all min-h-[44px]">
              {urlOut || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Hashes Generator */}
      <div className="glass-md p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Hash className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'توليد الهاشات والتجزئة الأمنية' : 'Cryptographic Hash Generator'}</span>
        </h3>

        <div className="space-y-2.5 font-mono text-xs">
          {[
            { name: 'MD5', hash: md5Hash, color: 'text-amber-400' },
            { name: 'SHA-1', hash: sha1Hash, color: 'text-orange-400' },
            { name: 'SHA-256', hash: sha256Hash, color: 'text-emerald-400' },
            { name: 'SHA-512', hash: sha512Hash, color: 'text-purple-400' },
          ].map((item) => (
            <div key={item.name} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between gap-3">
              <div className="w-20 font-bold shrink-0">
                <span className={item.color}>{item.name}</span>
              </div>
              <div className="flex-1 text-gray-300 truncate select-all">{item.hash || '...'}</div>
              <button
                onClick={() => copyVal(item.name, item.hash)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors shrink-0"
              >
                {copiedKey === item.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hash Type Identifier */}
      <div className="glass-md p-6 rounded-2xl border border-white/10 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-400" />
          <span>{isAr ? 'مكتشف نوع الهاش التلقائي' : 'Automatic Hash Type Detector'}</span>
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={hashToIdentify}
            onChange={(e) => setHashToIdentify(e.target.value)}
            placeholder="Paste raw hash string (e.g. 5d41402abc4b2a76b9719d911017c592)"
            className="flex-1 p-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
          />
          {identifiedHashType && identifiedHashType.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {identifiedHashType.map((h, idx) => (
                <div key={idx} className="px-3 py-2 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* JWT Inspector */}
      <div className="glass-md p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-400" />
          <span>{isAr ? 'محلل رموز JWT وفحص الصلاحيات والانتهاء' : 'JWT Claims & Expiration Inspector'}</span>
        </h3>

        <textarea
          rows={2}
          value={jwtInput}
          onChange={(e) => setJwtInput(e.target.value)}
          placeholder="Paste Bearer JWT token here (Header.Payload.Signature)"
          className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500 resize-none"
        />

        {jwtParsed?.valid ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="text-xs font-mono text-red-400 font-bold">HEADER: Algorithm & Token Type</div>
              <pre className="p-3 bg-black/80 rounded-lg text-xs font-mono text-red-300 overflow-x-auto">
                {JSON.stringify(jwtParsed.header, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-400 font-bold">PAYLOAD: Claims & Data</span>
                {jwtParsed.expiresAt && (
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    jwtParsed.isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {jwtParsed.isExpired ? 'EXPIRED' : 'ACTIVE'} ({jwtParsed.expiresAt.toLocaleDateString()})
                  </span>
                )}
              </div>
              <pre className="p-3 bg-black/80 rounded-lg text-xs font-mono text-purple-300 overflow-x-auto">
                {JSON.stringify(jwtParsed.payload, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 font-mono">
            {isAr ? 'رمز JWT غير صالح أو بتنسيق غير مدعوم.' : 'Invalid or malformed JWT token structure.'}
          </div>
        )}
      </div>
    </motion.div>
  );
}
