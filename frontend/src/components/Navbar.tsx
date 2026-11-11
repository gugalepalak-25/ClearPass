import React, { useState } from 'react';
import {
  Shield,
  Search,
  Award,
  Users,
  Activity,
  Settings,
  Wallet,
  LogOut,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useNearWallet } from '../wallet/NearWalletContext.js';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const { accountId, isConnected, isSimulated, connect, disconnect, simulateAccount } = useNearWallet();
  const [copied, setCopied] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'scanner', label: 'Risk Scanner', icon: Search },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'auditor', label: 'Auditor Portal', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleCopy = () => {
    if (accountId) {
      navigator.clipboard.writeText(accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header
      style={{
        background: 'rgba(5, 12, 9, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab('overview')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f0fdf4', letterSpacing: '-0.02em' }}>
                ClearPass
              </span>
              <span className="badge badge-approved" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                NEAR
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Privacy-Preserving Fund Risk Protocol
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', padding: '4px 0' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#34d399' : '#94a3b8',
                  background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Network & Wallet Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Testnet Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#94a3b8',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span>Testnet</span>
          </div>

          {/* Wallet Connection */}
          {isConnected && accountId ? (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '4px 8px 4px 12px',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0fdf4' }}>
                    {accountId.length > 20 ? `${accountId.slice(0, 8)}...${accountId.slice(-6)}` : accountId}
                  </span>
                  {isSimulated && (
                    <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 500 }}>
                      Demo Mode
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCopy}
                  title="Copy account ID"
                  style={{
                    background: 'transparent',
                    color: '#94a3b8',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>

                <button
                  onClick={() => disconnect()}
                  title="Disconnect wallet"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    padding: '5px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              >
                <Wallet size={16} />
                <span>Connect Wallet</span>
                <ChevronDown size={14} />
              </button>

              {showWalletMenu && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '115%',
                    width: '260px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '10px',
                    padding: '8px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                    zIndex: 60,
                  }}
                >
                  <div style={{ padding: '6px 10px', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Select Connection
                  </div>

                  <button
                    onClick={() => {
                      setShowWalletMenu(false);
                      connect();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: '#f0fdf4',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Wallet size={16} color="#10b981" />
                    <span>NEAR Wallet Selector</span>
                  </button>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '6px 0' }} />

                  <div style={{ padding: '6px 10px', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Instant Demo Accounts
                  </div>

                  <button
                    onClick={() => {
                      setShowWalletMenu(false);
                      simulateAccount('alice-clean-demo.testnet');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: '#34d399',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Sparkles size={14} />
                    <span>Alice (Low-Risk Demo)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowWalletMenu(false);
                      simulateAccount('charlie-compromised-demo.testnet');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: '#f87171',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Sparkles size={14} />
                    <span>Charlie (Flagged Demo)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowWalletMenu(false);
                      simulateAccount('unknown-dormant-demo.testnet');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      color: '#fbbf24',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Sparkles size={14} />
                    <span>Dormant (Inconclusive Demo)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

