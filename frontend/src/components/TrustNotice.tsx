import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const TrustNotice: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: compact ? '10px 14px' : '14px 18px',
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '10px',
        fontSize: '0.85rem',
        color: '#cbd5e1',
        lineHeight: 1.45,
        margin: '12px 0 20px',
      }}
    >
      <div style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }}>
        <ShieldCheck size={compact ? 16 : 18} />
      </div>
      <div>
        <strong style={{ color: '#f0fdf4', display: 'block', marginBottom: '2px' }}>
          Limited-Scope Assessment Notice
        </strong>
        ClearPass validates that the evaluated account passed a defined risk scope (up to 3 transaction hops against known watchlist version). It does not certify that any wallet or funds are absolutely clean or perpetually compliant.
      </div>
    </div>
  );
};

