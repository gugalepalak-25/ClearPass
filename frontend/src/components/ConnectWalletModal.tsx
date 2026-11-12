import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Wallet,
  Globe,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { useNearWallet } from '../wallet/NearWalletContext.js';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ isOpen, onClose }) => {
  const {
    selector,
    modal,
    networkId,
    setNetworkId,
    connectWalletById,
    connectAccount,
    simulateAccount,
    isConnecting,
    connectionError,
  } = useNearWallet();

  const [activeTab, setActiveTab] = useState<'wallets' | 'custom' | 'demo'>('wallets');
  const [customAccountId, setCustomAccountId] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const supportedWallets = [
    {
      id: 'my-near-wallet',
      name: 'MyNearWallet',
      type: 'Web Wallet',
      description: 'The standard web-based wallet for NEAR',
      icon: '🌐',
      popular: true,
    },
    {
      id: 'meteor-wallet',
      name: 'Meteor Wallet',
      type: 'Browser Extension & Web',
      description: 'Feature-rich DeFi wallet for NEAR',
      icon: '☄️',
      popular: true,
    },
    {
      id: 'here-wallet',
      name: 'HERE Wallet',
      type: 'Mobile & Web',
      description: 'Non-custodial mobile wallet for NEAR Protocol',
      icon: '📱',
      popular: true,
    },
    {
      id: 'sender',
      name: 'Sender Wallet',
      type: 'Browser Extension',
      description: 'Security-audited browser extension wallet',
      icon: '⚡',
      popular: false,
    },
    {
      id: 'nightly',
      name: 'Nightly Wallet',
      type: 'Multi-chain Extension',
      description: 'Next-gen multi-chain extension wallet',
      icon: '🌙',
      popular: false,
    },
    {
      id: 'ledger',
      name: 'Ledger Hardware',
      type: 'Hardware Security',
      description: 'Connect via USB / WebHID cold storage',
      icon: '🔒',
      popular: false,
    },
  ];

  const demoProfiles = [
    {
      id: 'alice-clean-demo.testnet',
      label: 'alice-clean-demo.testnet',
      badge: 'Approved',
      badgeClass: 'badge-approved',
      desc: 'Clean transactional history, 0 hops to risk entities',
    },
    {
      id: 'clean-merchant.testnet',
      label: 'clean-merchant.testnet',
      badge: 'Approved',
      badgeClass: 'badge-approved',
      desc: 'High-volume compliant commercial account',
    },
    {
      id: 'scammer-sybil.testnet',
      label: 'scammer-sybil.testnet',
      badge: 'Rejected',
      badgeClass: 'badge-rejected',
      desc: 'Direct interaction with flagged exploit address',
    },
    {
      id: 'fresh-user.testnet',
      label: 'fresh-user.testnet',
      badge: 'Inconclusive',
      badgeClass: 'badge-inconclusive',
      desc: 'Insufficient history, requires manual auditor proof',
    },
  ];

  const handleSelectWallet = async (walletId: string) => {
    try {
      if (connectWalletById) {
        await connectWalletById(walletId);
        onClose();
      } else if (modal) {
        modal.show();
        onClose();
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
    }
  };

  const handleConnectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = customAccountId.trim().toLowerCase();
    if (!cleanId) {
      setCustomError('Please enter a valid NEAR account address.');
      return;
    }

    if (!cleanId.includes('.') && cleanId.length !== 64) {
      setCustomError('Account ID must end with .testnet, .near, or be a 64-char implicit public key.');
      return;
    }

    setCustomError(null);
    connectAccount(cleanId);
    onClose();
  };

  const handleSelectDemo = (accountId: string) => {
    simulateAccount(accountId);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-glass rounded-3xl w-full max-w-lg border border-white/15 bg-black/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium text-base">
                  Connect NEAR Wallet
                </h3>
                <p className="text-white/50 text-xs">
                  Select your wallet or connect any NEAR address
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Network Toggle */}
              <div className="flex items-center bg-white/[0.06] rounded-full p-0.5 border border-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => setNetworkId('testnet')}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                    networkId === 'testnet' ? 'bg-white text-black font-semibold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Testnet
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkId('mainnet')}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                    networkId === 'mainnet' ? 'bg-white text-black font-semibold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Mainnet
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-white/10 px-6 pt-2 bg-white/[0.02]">
            <button
              onClick={() => setActiveTab('wallets')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'wallets'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Wallets ({supportedWallets.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'custom'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Any Address / ID
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'demo'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Demo Profiles
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {connectionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{connectionError}</span>
              </div>
            )}

            {/* TAB 1: ALL SUPPORTED WALLETS */}
            {activeTab === 'wallets' && (
              <div className="flex flex-col gap-2.5">
                {supportedWallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleSelectWallet(w.id)}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/25 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{w.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">
                            {w.name}
                          </span>
                          {w.popular && (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="text-white/50 text-xs mt-0.5">
                          {w.description}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}

                {modal && (
                  <button
                    onClick={() => {
                      modal.show();
                      onClose();
                    }}
                    className="mt-2 w-full py-2.5 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 hover:text-white text-xs font-medium text-center transition-colors"
                  >
                    Open Official NEAR Selector Modal
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: CONNECT ANY ADDRESS / ACCOUNT ID */}
            {activeTab === 'custom' && (
              <form onSubmit={handleConnectCustom} className="flex flex-col gap-4">
                <div>
                  <label className="block text-white/80 text-xs font-medium mb-1.5">
                    Connect Any NEAR Account ID or Public Key
                  </label>
                  <p className="text-white/50 text-xs mb-3 leading-relaxed">
                    Connect any account without installing an extension. Ideal for checking institutional vaults, cold storage, exchange deposit wallets, or smart contracts.
                  </p>
                  <input
                    type="text"
                    autoFocus
                    value={customAccountId}
                    onChange={(e) => {
                      setCustomAccountId(e.target.value);
                      setCustomError(null);
                    }}
                    placeholder={`e.g. user.${networkId === 'testnet' ? 'testnet' : 'near'} or 64-character account ID`}
                    className="input-field font-mono text-xs"
                  />
                  {customError && (
                    <p className="text-rose-400 text-xs mt-1.5">{customError}</p>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/60 space-y-1">
                  <div className="font-medium text-white/80">Address Guidelines:</div>
                  <div>• Named accounts: <code className="text-purple-300">yourname.testnet</code> or <code className="text-purple-300">account.near</code></div>
                  <div>• Implicit accounts: 64-hex string derived from Ed25519 public key</div>
                  <div>• Subaccounts: <code className="text-purple-300">treasury.foundation.near</code></div>
                </div>

                <button
                  type="submit"
                  disabled={!customAccountId.trim()}
                  className="btn btn-primary w-full py-2.5 text-xs font-semibold"
                >
                  Connect Address & Start Scanning
                </button>
              </form>
            )}

            {/* TAB 3: DEMO SIMULATION PROFILES */}
            {activeTab === 'demo' && (
              <div className="flex flex-col gap-2.5">
                <p className="text-white/50 text-xs mb-1">
                  Evaluate ClearPass risk engine behavior instantly using synthetic blockchain scenarios:
                </p>
                {demoProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectDemo(p.id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white text-xs font-medium">
                          {p.label}
                        </span>
                        <span className={`badge ${p.badgeClass} text-[10px]`}>
                          {p.badge}
                        </span>
                      </div>
                      <div className="text-white/50 text-[11px] mt-0.5">
                        {p.desc}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Security Note */}
          <div className="px-6 py-3 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-[11px] text-white/50">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-purple-400" />
              <span>Zero-knowledge: ClearPass never asks for private keys or seed phrases</span>
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

