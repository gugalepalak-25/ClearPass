import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  Wallet,
  LogOut,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useNearWallet } from '../wallet/NearWalletContext.js';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenDemo,
}) => {
  const { accountId, isConnected, isSimulated, connect, disconnect, simulateAccount } = useNearWallet();
  const [copied, setCopied] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const handleCopy = () => {
    if (accountId) {
      navigator.clipboard.writeText(accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'scanner', label: 'Scanner' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'auditor', label: 'Auditor' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 px-6 py-6 w-full"
    >
      <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto shadow-2xl">
        {/* Left side */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div
            onClick={() => onSelectTab('landing')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Globe className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-white font-semibold text-lg tracking-tight">
              ClearPass
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
              NEAR Testnet
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-white/80 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`relative cursor-pointer transition-colors duration-300 ${isActive ? 'text-white font-semibold' : 'hover:text-white'
                    }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 relative">
          {/* Demo walkthrough / quick guide */}
          <button
            onClick={() => (onOpenDemo ? onOpenDemo() : onSelectTab('landing'))}
            className="text-white hover:text-white/80 transition-colors text-sm font-medium cursor-pointer hidden sm:block"
          >
            Video Demo
          </button>

          {/* Wallet / Login Action */}
          {!isConnected ? (
            <button
              onClick={() => connect()}
              className="rounded-full px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:shadow-[0_0_24px_rgba(168,85,247,0.55)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-lg border border-white/20"
            >
              <Wallet className="w-4 h-4 stroke-[2.5]" />
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="liquid-glass rounded-full px-4 py-1.5 text-sm font-medium text-white hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#c084fc]" />
                <span className="font-mono text-xs max-w-[130px] truncate text-purple-300">
                  {accountId}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/60" />
              </button>

              <AnimatePresence>
                {showWalletMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl p-3 bg-black/90 border border-white/15 backdrop-blur-2xl shadow-2xl z-50 text-xs text-white"
                  >
                    <div className="p-2 border-b border-white/10 mb-2">
                      <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">
                        Connected Account
                      </div>
                      <div className="font-mono text-white text-xs truncate mb-2">
                        {accountId}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/90 text-[11px]"
                        >
                          {copied ? <Check className="w-3 h-3 text-purple-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`https://testnet.nearblocks.io/address/${accountId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/90 text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Explorer</span>
                        </a>
                      </div>
                    </div>

                    {/* Quick Demo Accounts */}
                    <div className="p-2 border-b border-white/10 mb-2">
                      <button
                        onClick={() => {
                          setShowWalletMenu(false);
                          connect();
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white text-[11px] font-medium transition-colors mb-2"
                      >
                        <Wallet className="w-3.5 h-3.5 text-purple-400" />
                        <span>Connect Another Wallet / Address</span>
                      </button>

                      <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Demo Test Profiles</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            simulateAccount('clean-merchant.testnet');
                            setShowWalletMenu(false);
                          }}
                          className="text-left px-2 py-1 rounded hover:bg-white/10 text-[11px] text-purple-300"
                        >
                          clean-merchant.testnet (Clean)
                        </button>
                        <button
                          onClick={() => {
                            simulateAccount('scammer-sybil.testnet');
                            setShowWalletMenu(false);
                          }}
                          className="text-left px-2 py-1 rounded hover:bg-white/10 text-[11px] text-rose-300"
                        >
                          scammer-sybil.testnet (Flagged)
                        </button>
                        <button
                          onClick={() => {
                            simulateAccount('fresh-user.testnet');
                            setShowWalletMenu(false);
                          }}
                          className="text-left px-2 py-1 rounded hover:bg-white/10 text-[11px] text-amber-300"
                        >
                          fresh-user.testnet (Inconclusive)
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        disconnect();
                        setShowWalletMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-rose-400 hover:bg-rose-500/10 text-left transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};
