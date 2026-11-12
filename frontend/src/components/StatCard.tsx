import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'purple' | 'amber' | 'red' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'purple',
}) => {
  const badgeClass =
    badgeColor === 'purple'
      ? 'badge-purple'
      : badgeColor === 'emerald'
      ? 'badge-approved'
      : badgeColor === 'amber'
      ? 'badge-inconclusive'
      : badgeColor === 'red'
      ? 'badge-rejected'
      : 'badge-neutral';

  return (
    <div className="glass-card flex flex-col justify-between group hover:border-purple-500/40 transition-all duration-300">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500/15 via-violet-500/15 to-transparent border border-white/10 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:text-purple-300 transition-all">
            <Icon size={18} />
          </div>
        </div>

        <div className="flex items-baseline gap-2.5 my-1">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
            {value}
          </span>
          {badge && <span className={`badge ${badgeClass} text-[10px]`}>{badge}</span>}
        </div>
      </div>

      {subtitle && (
        <span className="text-xs text-slate-500 mt-2 font-mono truncate">{subtitle}</span>
      )}
    </div>
  );
};
