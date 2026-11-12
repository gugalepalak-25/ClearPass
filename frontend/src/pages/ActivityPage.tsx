import React, { useState, useEffect } from 'react';
import {
  Activity as ActivityIcon,
  Search,
  Award,
  ShieldAlert,
  Users,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { fetchActivity } from '../services/api.js';
import { ActivityLogEntry } from '../types/index.js';

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await fetchActivity();
      setActivities(data);
    } catch (err) {
      console.warn('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activities.filter((act) => {
    if (filterType !== 'ALL' && act.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAddress = act.walletAddress.toLowerCase().includes(q);
      const matchDetails = act.details.toLowerCase().includes(q);
      const matchCert = act.certificateId?.toLowerCase().includes(q);
      return matchAddress || matchDetails || matchCert;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[420px] h-[300px] bg-gradient-to-bl from-purple-600/30 via-violet-600/20 to-transparent rounded-full blur-[100px] pointer-events-none -z-10 group-hover:opacity-100 transition-opacity" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <ActivityIcon className="w-3.5 h-3.5" />
            <span>Immutable Protocol Audit Trail</span>
          </div>

          <h1
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight mb-3"
          >
            Protocol Activity &{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              Audit Trail
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-light">
            Real-time, chronological log of all fund risk evaluations, cryptographic certificate issuances,
            on-chain and off-chain verifications, and selective disclosure share events.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-3xl p-5 border border-white/10 shadow-xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            className="w-full liquid-glass rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:border-purple-500/50 outline-none bg-black/40 transition-all font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by wallet account, cert ID, or keyword..."
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'SCAN_EXECUTED', label: 'Scans' },
            { id: 'CERTIFICATE_ISSUED', label: 'Certificates' },
            { id: 'CERTIFICATE_VERIFIED', label: 'Verifications' },
            { id: 'AUDITOR_SHARE_CREATED', label: 'Shares' },
            { id: 'CERTIFICATE_REVOKED', label: 'Revocations' },
          ].map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/25'
                    : 'liquid-glass text-white/70 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <button
            onClick={loadActivities}
            title="Refresh events"
            className="p-2.5 rounded-xl liquid-glass text-slate-400 hover:text-white hover:border-white/20 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Activity List Container */}
      <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Clock size={16} className="text-purple-400" />
            <span>Event Feed ({filtered.length} entries)</span>
          </div>
          <span className="text-xs text-slate-400">Live NEAR Testnet Feed</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading activity stream...</div>
        ) : filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((item) => {
              const isScan = item.type === 'SCAN_EXECUTED';
              const isCert = item.type === 'CERTIFICATE_ISSUED';
              const isVerify = item.type === 'CERTIFICATE_VERIFIED';
              const isShare = item.type === 'AUDITOR_SHARE_CREATED';
              const isRevoke = item.type === 'CERTIFICATE_REVOKED';

              return (
                <div
                  key={item.id}
                  className="liquid-glass rounded-2xl p-4 md:p-5 border border-white/10 hover:border-purple-500/30 transition-all flex items-start justify-between flex-wrap md:flex-nowrap gap-4 bg-white/[0.01]"
                >
                  <div className="flex items-start gap-4">
                    {/* Glowing Event Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        isScan
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-sm shadow-purple-500/20'
                          : isCert
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20'
                          : isVerify
                          ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-sm shadow-violet-500/20'
                          : isShare
                          ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 shadow-sm shadow-fuchsia-500/20'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-sm shadow-rose-500/20'
                      }`}
                    >
                      {isScan && <Search size={18} />}
                      {isCert && <Award size={18} />}
                      {isVerify && <ShieldCheck size={18} />}
                      {isShare && <Users size={18} />}
                      {isRevoke && <ShieldAlert size={18} />}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="font-semibold text-white text-sm md:text-base leading-snug">
                        {item.details}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          Target: <code className="text-white font-mono">{item.walletAddress}</code>
                        </span>
                        {item.certificateId && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              Cert:{' '}
                              <code className="text-purple-300 font-mono font-semibold">
                                {item.certificateId}
                              </code>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 font-mono whitespace-nowrap self-start md:self-center">
                    {new Date(item.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="liquid-glass rounded-2xl p-12 text-center text-slate-400 text-sm border border-dashed border-white/10">
            No activity matches the current search query or filter.
          </div>
        )}
      </div>
    </div>
  );
};
