import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Network, Cpu, Copy, Check, Filter } from 'lucide-react';
import { calculateSubnet, SubnetCalcResult } from '../../lib/cyberArsenal';

export default function SubnetMatrix({ isAr = false }: { isAr?: boolean }) {
  const [inputVal, setInputVal] = useState('192.168.1.0/24');
  const [calcResult, setCalcResult] = useState<SubnetCalcResult | null>(() => calculateSubnet('192.168.1.0/24'));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCalculate = (str: string) => {
    setInputVal(str);
    const res = calculateSubnet(str);
    setCalcResult(res);
  };

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
      {/* Input controls */}
      <div className="glass-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Network className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => handleCalculate(e.target.value)}
              placeholder="e.g. 10.0.0.0/16 or 172.16.5.10/28"
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[16, 24, 27, 28, 30].map((slash) => (
              <button
                key={slash}
                type="button"
                onClick={() => {
                  const ipOnly = inputVal.split('/')[0] || '192.168.1.0';
                  handleCalculate(`${ipOnly}/${slash}`);
                }}
                className={`px-3 py-3 rounded-xl font-mono text-xs transition-colors cursor-pointer ${
                  calcResult?.cidr === slash
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                }`}
              >
                /{slash}
              </button>
            ))}
          </div>
        </div>

        {/* Quick sample IPs */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-mono text-gray-500">{isAr ? 'أمثلة سريعة:' : 'Quick Subnets:'}</span>
          {['10.0.0.0/8', '172.16.0.0/12', '192.168.1.0/24', '192.168.100.0/27', '1.1.1.1/32'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleCalculate(s)}
              className="px-2.5 py-1 rounded bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-mono cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {!calcResult ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 glass-md rounded-2xl border border-gray-200 dark:border-white/10">
          {isAr ? 'يرجى إدخال عنوان IPv4 صالح بتنسيق CIDR (مثال: 192.168.1.0/24)' : 'Please enter a valid IPv4 address in CIDR format (e.g. 192.168.1.0/24)'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-md p-4 rounded-xl border border-gray-200 dark:border-white/10">
              <div className="text-xs font-mono text-gray-500 dark:text-gray-400">TOTAL HOSTS</div>
              <div className="text-xl font-bold font-mono text-gray-900 dark:text-white mt-1">{calcResult.totalHosts.toLocaleString()}</div>
            </div>
            <div className="glass-md p-4 rounded-xl border border-gray-200 dark:border-white/10">
              <div className="text-xs font-mono text-gray-500 dark:text-gray-400">USABLE HOSTS</div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{calcResult.usableHosts.toLocaleString()}</div>
            </div>
            <div className="glass-md p-4 rounded-xl border border-gray-200 dark:border-white/10">
              <div className="text-xs font-mono text-gray-500 dark:text-gray-400">IP CLASS / SCOPE</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 flex items-center flex-wrap gap-2">
                <span>Class {calcResult.ipClass}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${calcResult.isPrivate ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'}`}>
                  {calcResult.isPrivate ? 'Private' : 'Public'}
                </span>
              </div>
            </div>
            <div className="glass-md p-4 rounded-xl border border-gray-200 dark:border-white/10">
              <div className="text-xs font-mono text-gray-500 dark:text-gray-400">WILDCARD</div>
              <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">{calcResult.wildcard}</div>
            </div>
          </div>

          {/* Matrix Details Table */}
          <div className="glass-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? 'مصفوفة تفاصيل الشبكة الفرعية' : 'Subnet Allocation Matrix'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              {[
                { label: 'Network Address', val: calcResult.networkAddress, key: 'net' },
                { label: 'Broadcast Address', val: calcResult.broadcastAddress, key: 'bcast' },
                { label: 'First Usable Host', val: calcResult.firstUsableIp, key: 'first' },
                { label: 'Last Usable Host', val: calcResult.lastUsableIp, key: 'last' },
                { label: 'Subnet Mask', val: calcResult.netmask, key: 'mask' },
                { label: 'Wildcard Mask', val: calcResult.wildcard, key: 'wild' },
                { label: 'IP in Binary', val: calcResult.ipBinary, key: 'ipbin' },
                { label: 'Mask in Binary', val: calcResult.maskBinary, key: 'maskbin' },
              ].map((row) => (
                <div key={row.key} className="p-3 bg-white/80 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-gray-500 dark:text-gray-400 text-[11px]">{row.label}</div>
                    <div className="text-gray-900 dark:text-white font-bold mt-0.5 truncate">{row.val}</div>
                  </div>
                  <button
                    onClick={() => copyVal(row.key, row.val)}
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors shrink-0 cursor-pointer"
                    title="Copy value"
                  >
                    {copiedKey === row.key ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Subnet Division Splits */}
          {calcResult.subnetsSplit && calcResult.subnetsSplit.length > 0 && (
            <div className="glass-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'تقسيم الشبكة المباشر إلى /' + (calcResult.cidr + 1) : `Next Subnet Split (/${calcResult.cidr + 1})`}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {calcResult.subnetsSplit.map((split, idx) => (
                  <div key={idx} className="p-3.5 bg-white/80 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/5 font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold">
                      <span>Subnet #{idx + 1} (/{split.cidr})</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{split.count} hosts</span>
                    </div>
                    <div className="text-gray-900 dark:text-white">Net: {split.network}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-[11px]">Range: {split.usableRange}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
