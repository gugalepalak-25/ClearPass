import React, { createContext, useContext, useState, useEffect } from 'react';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import { setupSender } from '@near-wallet-selector/sender';
import { setupNightly } from '@near-wallet-selector/nightly';
import { setupLedger } from '@near-wallet-selector/ledger';
import '@near-wallet-selector/modal-ui/styles.css';

export interface NearWalletContextType {
  selector: WalletSelector | null;
  modal: any | null;
  accountId: string | null;
  networkId: 'testnet' | 'mainnet';
  setNetworkId: (net: 'testnet' | 'mainnet') => void;
  isConnected: boolean;
  isSimulated: boolean;
  isConnecting: boolean;
  isWalletModalOpen: boolean;
  connectionError: string | null;
  connect: () => Promise<void>;
  connectWalletById: (walletId: string) => Promise<void>;
  connectAccount: (accountId: string, network?: 'testnet' | 'mainnet') => void;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  disconnect: () => Promise<void>;
  simulateAccount: (accountId: string) => void;
  clearSimulatedAccount: () => void;
}

export const NearWalletContext = createContext<NearWalletContextType | null>(null);

export const NearWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [networkId, setNetworkIdState] = useState<'testnet' | 'mainnet'>('testnet');

  useEffect(() => {
    let isMounted = true;

    async function initSelector() {
      try {
        const modules: any[] = [setupMyNearWallet()];

        try { modules.push(setupMeteorWallet()); } catch (e) { console.warn('[NearWallet] Meteor:', e); }
        try { modules.push(setupHereWallet()); } catch (e) { console.warn('[NearWallet] Here:', e); }
        try { modules.push(setupSender()); } catch (e) { console.warn('[NearWallet] Sender:', e); }
        try { modules.push(setupNightly()); } catch (e) { console.warn('[NearWallet] Nightly:', e); }
        try { modules.push(setupLedger()); } catch (e) { console.warn('[NearWallet] Ledger:', e); }

        const _selector = await setupWalletSelector({
          network: networkId,
          modules,
        });

        const _modal = setupModal(_selector, {
          contractId: networkId === 'testnet' ? 'clearpass.testnet' : 'clearpass.near',
        });

        const state = _selector.store.getState();
        const activeAccount = state.accounts.find((acc: AccountState) => acc.active) || state.accounts[0];

        if (isMounted) {
          setSelector(_selector);
          setModal(_modal);
          if (activeAccount) {
            setAccountId(activeAccount.accountId);
            setIsSimulated(false);
          }
        }

        // Subscribe to account changes
        _selector.store.observable.subscribe((nextState) => {
          if (!isMounted) return;
          const current = nextState.accounts.find((acc) => acc.active) || nextState.accounts[0];
          if (current) {
            setAccountId(current.accountId);
            setIsSimulated(false);
          } else if (!isSimulated) {
            setAccountId(null);
          }
        });
      } catch (err: any) {
        console.warn('[NearWallet] Wallet Selector initialization notice:', err?.message || err);
      }
    }

    initSelector();

    return () => {
      isMounted = false;
    };
  }, [networkId]);

  const setNetworkId = (net: 'testnet' | 'mainnet') => {
    setNetworkIdState(net);
  };

  const openWalletModal = () => {
    setConnectionError(null);
    setIsWalletModalOpen(true);
  };

  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
  };

  const connect = async () => {
    openWalletModal();
  };

  const connectWalletById = async (walletId: string) => {
    setConnectionError(null);
    setIsConnecting(true);
    try {
      if (!selector) {
        throw new Error('Wallet selector is still initializing.');
      }
      const wallet = await selector.wallet(walletId);
      if (wallet) {
        await (wallet.signIn as any)({
          contractId: networkId === 'testnet' ? 'clearpass.testnet' : 'clearpass.near',
        });
        closeWalletModal();
      }
    } catch (err: any) {
      console.warn(`[NearWallet] Connecting to ${walletId} note:`, err);
      setConnectionError(err?.message || `Could not connect to ${walletId}. Check if extension is installed or supported.`);
      // If extension is not installed, open modal-ui selector as fallback
      if (modal) {
        modal.show();
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connectAccount = (accId: string, net?: 'testnet' | 'mainnet') => {
    const clean = accId.trim();
    if (!clean) return;
    if (net && net !== networkId) {
      setNetworkIdState(net);
    }
    setAccountId(clean);
    setIsSimulated(true);
    setConnectionError(null);
    closeWalletModal();
  };

  const disconnect = async () => {
    try {
      if (isSimulated) {
        setAccountId(null);
        setIsSimulated(false);
        return;
      }

      if (selector) {
        const wallet = await selector.wallet();
        await wallet.signOut();
        setAccountId(null);
      }
    } catch (err: any) {
      console.warn('[NearWallet] Error disconnecting:', err);
      setAccountId(null);
      setIsSimulated(false);
    }
  };

  const simulateAccount = (accId: string) => {
    setAccountId(accId.trim());
    setIsSimulated(true);
    setConnectionError(null);
    closeWalletModal();
  };

  const clearSimulatedAccount = () => {
    setAccountId(null);
    setIsSimulated(false);
  };

  return (
    <NearWalletContext.Provider
      value={{
        selector,
        modal,
        accountId,
        networkId,
        setNetworkId,
        isConnected: !!accountId,
        isSimulated,
        isConnecting,
        isWalletModalOpen,
        connectionError,
        connect,
        connectWalletById,
        connectAccount,
        openWalletModal,
        closeWalletModal,
        disconnect,
        simulateAccount,
        clearSimulatedAccount,
      }}
    >
      {children}
    </NearWalletContext.Provider>
  );
};

export function useNearWallet() {
  const context = useContext(NearWalletContext);
  if (!context) {
    throw new Error('useNearWallet must be used within a NearWalletProvider');
  }
  return context;
}
