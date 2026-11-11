import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const TrustNotice: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div
      className={`liquid-glass rounded-2xl flex items-start gap-3.5 border border-emerald-500/25 bg-emerald-500/[0.03] backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.08)] ${
        compact ? 'p-3 text-xs' : 'p-4 md:p-5 text-sm my-2 mb-6'
      }`}
    >
      <div className="text-emerald-400 shrink-0 mt-0.5 p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <ShieldCheck size={compact ? 16 : 18} />
      </div>
      <div className="leading-relaxed">
        <strong className="text-white block font-semibold mb-1 tracking-wide">
          Limited-Scope Assessment Notice
        </strong>
        <span className="text-slate-400">
          ClearPass validates that the evaluated account passed a defined risk scope (up to 3 transaction hops against known watchlist version). It does not certify that any wallet or funds are absolutely clean or perpetually compliant.
        </span>
      </div>
    </div>
  );
};
