import React, { useState, useEffect } from 'react';
import {
  Activity as ActivityIcon,
  Search,
  Award,
  ShieldAlert,
  Users,
  ShieldCheck,
  RefreshCw,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0fdf4', marginBottom: '4px' }}>
            Protocol Activity Trail
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Chronological, immutable audit trail of all verification queries, certificates, and selective disclosure events.
          </p>
        </div>
        <button onClick={loadActivities} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by account ID, cert ID, or keyword..."
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'SCAN_EXECUTED', label: 'Scans' },
            { id: 'CERTIFICATE_ISSUED', label: 'Certificates' },
            { id: 'CERTIFICATE_VERIFIED', label: 'Verifications' },
            { id: 'AUDITOR_SHARE_CREATED', label: 'Shares' },
            { id: 'CERTIFICATE_REVOKED', label: 'Revocations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: filterType === tab.id ? 'var(--border-medium)' : 'transparent',
                color: filterType === tab.id ? '#34d399' : '#94a3b8',
                border: filterType === tab.id ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const isScan = item.type === 'SCAN_EXECUTED';
            const isCert = item.type === 'CERTIFICATE_ISSUED';
            const isVerify = item.type === 'CERTIFICATE_VERIFIED';
            const isShare = item.type === 'AUDITOR_SHARE_CREATED';
            const isRevoke = item.type === 'CERTIFICATE_REVOKED';

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isScan
                        ? 'rgba(16, 185, 129, 0.1)'
                        : isCert
                        ? 'rgba(52, 211, 153, 0.15)'
                        : isRevoke
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(148, 163, 184, 0.1)',
                      color: isScan
                        ? '#34d399'
                        : isCert
                        ? '#10b981'
                        : isRevoke
                        ? '#ef4444'
                        : '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {isScan && <Search size={16} />}
                    {isCert && <Award size={16} />}
                    {isVerify && <ShieldCheck size={16} />}
                    {isShare && <Users size={16} />}
                    {isRevoke && <ShieldAlert size={16} />}
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, color: '#f0fdf4', fontSize: '0.9rem', marginBottom: '3px' }}>
                      {item.details}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#64748b' }}>
                      <span>Target: <code style={{ color: '#94a3b8' }}>{item.walletAddress}</code></span>
                      {item.certificateId && (
                        <span>Cert: <code style={{ color: '#34d399' }}>{item.certificateId}</code></span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748b', fontSize: '0.9rem' }}>
            No activity matches the current search or filter.
          </div>
        )}
      </div>
    </div>
  );
};

