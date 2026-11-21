import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Globe, RefreshCw, AlertTriangle, CheckCircle2, 
  XCircle, Sparkles, Copy, Check 
} from 'lucide-react';
import { HeaderAuditResult } from '../../types';
import { generateConfigSnippet } from '../../lib/headerAnalyzer';

export default function SecurityHeadersAudit({ isAr = false }: { isAr?: boolean }) {
  const [targetUrl, setTargetUrl] = useState('https://abdulrahmankamal.netlify.app');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HeaderAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedServer, setCopiedServer] = useState<string | null>(null);

  const handleAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ops/analyze-headers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status} scan failure`);
      }

      const auditData: HeaderAuditResult = await response.json();
      setResult(auditData);
    } catch (err: any) {
      console.error('Header audit failed:', err);
      setError(err.message || 'Failed to scan target host. Make sure host is online.');
    } finally {
      setLoading(false);
    }
  };

  const copyConfig = (server: 'nginx' | 'apache' | 'caddy') => {
    if (!result) return;
    const code = generateConfigSnippet(server, result.missingHeaders);
    navigator.clipboard.writeText(code);
    setCopiedServer(server);
    setTimeout(() => setCopiedServer(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Input Card */}
      <div className="glass-md p-6 rounded-2xl border border-gray-200 dark:border-white/10">
        <form onSubmit={handleAudit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="e.g. https://github.com or domain.com"
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'جاري الفحص...' : 'Auditing Target...'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{isAr ? 'فحص الترويسات' : 'Scan Headers'}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-mono text-gray-500">{isAr ? 'أهداف سريعة:' : 'Quick Presets:'}</span>
          {['https://abdulrahmankamal.netlify.app', 'https://github.com', 'https://cloudflare.com'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setTargetUrl(preset);
              }}
              className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-mono transition-colors cursor-pointer"
            >
              {preset.replace('https://', '')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">{isAr ? 'خطأ في الفحص' : 'Scan Error'}</div>
            <div className="text-xs text-red-500/90 dark:text-red-300/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Audit Result Display */}
      {result && (
        <div className="space-y-6">
          {/* Top Score Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-md p-5 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black font-mono shadow-xl shrink-0 ${
                result.score >= 85 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40' :
                result.score >= 70 ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40' :
                result.score >= 50 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40' :
                'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40'
              }`}>
                {result.grade}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-mono text-gray-500 dark:text-gray-400">{isAr ? 'الدرجة الأمنية' : 'SECURITY SCORE'}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.score}<span className="text-xs text-gray-500">/100</span></div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{result.statusDescription}</div>
              </div>
            </div>

            <div className="glass-md p-5 rounded-2xl border border-gray-200 dark:border-white/10">
              <div className="text-xs font-mono text-gray-500 dark:text-gray-400">{isAr ? 'الهدف المفحوص' : 'TARGET HOST'}</div>
              <div className="text-sm font-mono text-gray-900 dark:text-white truncate mt-1" title={result.targetUrl}>{result.targetUrl}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 font-mono text-gray-800 dark:text-gray-200">HTTP {result.statusCode}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{result.responseTimeMs}ms</span>
              </div>
            </div>

            <div className="glass-md p-5 rounded-2xl border border-gray-200 dark:border-white/10">
              <div className="text-xs font-mono text-gray-500 dark:text-gray-400">{isAr ? 'الترويسات المحمية' : 'PROTECTED HEADERS'}</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {result.configuredHeaders.length} <span className="text-xs text-gray-500 dark:text-gray-400">/ 6 recommended</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {result.missingHeaders.length === 0 ? 'Fully hardened' : `${result.missingHeaders.length} headers missing`}
              </div>
            </div>

            <div className="glass-md p-5 rounded-2xl border border-gray-200 dark:border-white/10">
              <div className="text-xs font-mono text-gray-500 dark:text-gray-400">{isAr ? 'تسريب المعلومات' : 'SERVER LEAKS'}</div>
              <div className={`text-sm font-semibold mt-1 flex items-center gap-1.5 ${
                result.serverLeaks.detected ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {result.serverLeaks.detected ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{result.serverLeaks.detected ? 'Server Details Exposed' : 'Minimal Footprint'}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 font-mono">
                {result.serverLeaks.server || result.serverLeaks.poweredBy || 'No banner leak detected'}
              </div>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="glass-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? 'تحليل الترويسات الدفاعية' : 'Defensive Headers Audit'}</span>
            </h3>

            <div className="space-y-3">
              {result.items.map((item) => (
                <div
                  key={item.header}
                  className={`p-4 rounded-xl border transition-colors ${
                    item.configured 
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/25' 
                      : 'bg-red-50/70 dark:bg-red-950/20 border-red-500/25'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {item.configured ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{item.header}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded font-mono ${
                          item.severity === 'critical' ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                          item.severity === 'high' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400' :
                          'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                        }`}>
                          {item.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                      item.configured ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/15 text-red-700 dark:text-red-300'
                    }`}>
                      {item.configured ? (isAr ? 'مُفعّل' : 'Configured') : (isAr ? 'مفقود' : 'Missing')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                    {item.description}
                  </p>

                  {item.value && (
                    <div className="mt-2.5 p-2 bg-zinc-900 dark:bg-black/60 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto break-all">
                      {item.value}
                    </div>
                  )}

                  {!item.configured && (
                    <div className="mt-2.5 p-2.5 bg-white/80 dark:bg-black/40 rounded-lg text-xs space-y-1 border border-gray-200/70 dark:border-white/5">
                      <div className="text-amber-700 dark:text-amber-400 font-medium">{isAr ? 'التوصية للإصلاح:' : 'Hardening Recommendation:'}</div>
                      <div className="text-gray-700 dark:text-gray-300">{item.recommendation}</div>
                      {item.exampleValue && (
                        <div className="font-mono text-gray-500 dark:text-gray-400 text-[11px] pt-1">
                          Example: <span className="text-blue-700 dark:text-blue-300">{item.exampleValue}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Remediation Snippet Generator */}
          {result.missingHeaders.length > 0 && (
            <div className="glass-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>{isAr ? 'توليد إعدادات الحماية بنقرة واحدة' : '1-Click Hardening Config Generator'}</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isAr 
                      ? 'انسخ إعدادات الترويسات المفقودة وألصقها في خادم الويب الخاص بك لسد الثغرات فوراً.' 
                      : 'Copy tailored configuration rules directly into your web server configuration.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {(['nginx', 'apache', 'caddy'] as const).map((srv) => (
                    <button
                      key={srv}
                      onClick={() => copyConfig(srv)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-mono text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedServer === srv ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="capitalize">{srv}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-zinc-900 dark:bg-black/80 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-gray-800 dark:border-white/5 max-h-56">
                  {generateConfigSnippet('nginx', result.missingHeaders)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
