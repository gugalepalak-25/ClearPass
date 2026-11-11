import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'red' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'emerald',
}) => {
  const badgeClass =
    badgeColor === 'emerald'
      ? 'badge-approved'
      : badgeColor === 'amber'
      ? 'badge-inconclusive'
      : badgeColor === 'red'
      ? 'badge-rejected'
      : 'badge-neutral';

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>{title}</span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
          }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f0fdf4', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {badge && <span className={`badge ${badgeClass}`}>{badge}</span>}
      </div>
      {subtitle && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{subtitle}</span>}
    </div>
  );
};

