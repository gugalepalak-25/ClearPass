import React, { createContext, useContext, useState, useEffect } from 'react';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import '@near-wallet-selector/modal-ui/styles.css';

export interface NearWalletContextType {
  selector: WalletSelector | null;
  modal: any | null;
  accountId: string | null;
  networkId: string;
  isConnected: boolean;
  isSimulated: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  simulateAccount: (accountId: string) => void;
  clearSimulatedAccount: () => void;
}

const NearWalletContext = createContext<NearWalletContextType | null>(null);

export const NearWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const networkId = 'testnet';

  useEffect(() => {
    let isMounted = true;

    async function initSelector() {
      try {
        const _selector = await setupWalletSelector({
          network: 'testnet',
          modules: [setupMyNearWallet()],
        });

        const _modal = setupModal(_selector, {
          contractId: 'clearpass.testnet',
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
        // Do not crash the app: user can still use demo simulator or connect when ready
      }
    }

    initSelector();

    return () => {
      isMounted = false;
    };
  }, []);

  const connect = async () => {
    setConnectionError(null);
    setIsConnecting(true);
    try {
      if (modal) {
        modal.show();
      } else {
        // Fallback: Default to demo testnet account
        simulateAccount('alice-clean-demo.testnet');
      }
    } catch (err: any) {
      setConnectionError(err?.message || 'Unable to open NEAR Wallet selector modal.');
    } finally {
      setIsConnecting(false);
    }
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
        isConnected: !!accountId,
        isSimulated,
        isConnecting,
        connectionError,
        connect,
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

