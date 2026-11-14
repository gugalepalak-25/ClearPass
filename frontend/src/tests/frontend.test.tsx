import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.js';
import { TrustNotice } from '../components/TrustNotice.js';
import { StatCard } from '../components/StatCard.js';
import { ErrorBoundary } from '../components/ErrorBoundary.js';
import { Navbar } from '../components/Navbar.js';
import { NearWalletContext, NearWalletContextType } from '../wallet/NearWalletContext.js';
import { Shield } from 'lucide-react';

beforeAll(() => {
  // Mock HTMLMediaElement.prototype.play for jsdom test environment
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe('ClearPass Frontend Component Suite', () => {
  it('renders App root without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
    expect(screen.getByText('ClearPass')).toBeTruthy();
  });

  it('renders brand title and protocol slogan', () => {
    render(<App />);
    const slogans = screen.getAllByText(/PRIVACY-PRESERVING FUND RISK VERIFICATION ON NEAR/i);
    expect(slogans.length).toBeGreaterThan(0);
    expect(screen.getByText(/Prove your money is clean/i)).toBeTruthy();
  });

  it('renders TrustNotice with limited-scope assessment disclaimer', () => {
    render(<TrustNotice />);
    expect(screen.getByText(/Limited-Scope Assessment Notice/i)).toBeTruthy();
    expect(screen.getByText(/ClearPass validates that the evaluated account passed a defined risk scope/i)).toBeTruthy();
  });

  it('renders StatCard with custom metrics and badges', () => {
    render(
      <StatCard
        title="Test Metric"
        value="42"
        subtitle="Testing subtitle"
        icon={Shield}
        badge="Approved"
        badgeColor="emerald"
      />
    );
    expect(screen.getByText('Test Metric')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('Approved')).toBeTruthy();
    expect(screen.getByText('Testing subtitle')).toBeTruthy();
  });

  it('switches navigation tabs when clicked', () => {
    render(<App />);
    // Select the navbar button specifically
    const scannerTabButtons = screen.getAllByText('Scanner');
    fireEvent.click(scannerTabButtons[0]);
    expect(screen.getByText('Assessment Parameters')).toBeTruthy();

    const certsTabButtons = screen.getAllByText('Certificates');
    fireEvent.click(certsTabButtons[0]);
    expect(screen.getByText('Verification Certificate Registry')).toBeTruthy();

    const auditorTabButtons = screen.getAllByText('Auditor');
    fireEvent.click(auditorTabButtons[0]);
    expect(screen.getByText(/Auditor Portal & Selective Disclosure/i)).toBeTruthy();
  });

  it('ErrorBoundary catches child render failures gracefully', () => {
    // Suppress console.error output during intentional error boundary test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ProblemChild = () => {
      throw new Error('Test boundary trigger');
    };

    render(
      <ErrorBoundary fallbackTitle="Custom Error View">
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error View')).toBeTruthy();
    expect(screen.getByText(/Test boundary trigger/i)).toBeTruthy();
    expect(screen.getByText('Reload Module')).toBeTruthy();

    spy.mockRestore();
  });

  it('renders connected wallet dropdown when down-arrow is clicked', () => {
    const mockDisconnect = vi.fn();
    const mockOpenWalletModal = vi.fn();
    const mockSimulate = vi.fn();

    const mockWalletValue: NearWalletContextType = {
      selector: null,
      modal: null,
      accountId: 'clean-merchant.testnet',
      networkId: 'testnet',
      setNetworkId: vi.fn(),
      isConnected: true,
      isSimulated: false,
      isConnecting: false,
      isWalletModalOpen: false,
      connectionError: null,
      connect: vi.fn(),
      connectWalletById: vi.fn(),
      connectAccount: vi.fn(),
      openWalletModal: mockOpenWalletModal,
      closeWalletModal: vi.fn(),
      disconnect: mockDisconnect,
      simulateAccount: mockSimulate,
      clearSimulatedAccount: vi.fn(),
    };

    render(
      <NearWalletContext.Provider value={mockWalletValue}>
        <Navbar activeTab="landing" onSelectTab={vi.fn()} />
      </NearWalletContext.Provider>
    );

    // Connected button should display truncated account
    const walletButton = screen.getByText(/clean-merchant\.testnet/i);
    expect(walletButton).toBeTruthy();

    // Dropdown items should not be in the document before click
    expect(screen.queryByText('Connected Account')).toBeNull();

    // Click the wallet button to toggle dropdown menu
    fireEvent.click(walletButton);

    // Dropdown items should now be visible
    expect(screen.getByText('Connected Account')).toBeTruthy();
    expect(screen.getByText('testnet')).toBeTruthy();
    expect(screen.getByText('Explorer')).toBeTruthy();
    expect(screen.getByText('Demo Test Profiles')).toBeTruthy();
    expect(screen.getByText('Disconnect Wallet')).toBeTruthy();
    expect(screen.getByText('Connect Another Wallet / Address')).toBeTruthy();
    expect(screen.getByText(/scammer-sybil\.testnet/i)).toBeTruthy();

    // Clicking Disconnect should call disconnect handler
    const disconnectButton = screen.getByText('Disconnect Wallet');
    fireEvent.click(disconnectButton);
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
