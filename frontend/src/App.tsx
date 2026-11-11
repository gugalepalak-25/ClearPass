import React, { useState } from 'react';
import { NearWalletProvider, useNearWallet } from './wallet/NearWalletContext.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { Navbar } from './components/Navbar.js';
import { Hero } from './components/Hero.js';
import { BackgroundVideo } from './components/BackgroundVideo.js';
import { VideoDemoModal } from './components/VideoDemoModal.js';
import { ConnectWalletModal } from './components/ConnectWalletModal.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { ScannerPage } from './pages/ScannerPage.js';
import { CertificatesPage } from './pages/CertificatesPage.js';
import { AuditorPage } from './pages/AuditorPage.js';
import { ActivityPage } from './pages/ActivityPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { VerificationCertificate } from './types/index.js';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedShareCertId, setSelectedShareCertId] = useState<string>('');
  const [targetScanAccount, setTargetScanAccount] = useState<string>('');
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const { isWalletModalOpen, closeWalletModal } = useNearWallet();

  const handleNavigateToShare = (certId: string) => {
    setSelectedShareCertId(certId);
    setActiveTab('auditor');
  };

  const handleCertificateIssued = (cert: VerificationCertificate) => {
    setSelectedShareCertId(cert.certificateId);
  };

  return (
    <main className="relative bg-black h-screen w-screen flex flex-col overflow-hidden selection:bg-white selection:text-black shrink-0">
      {/* Background Video using Mux HLS stream */}
      <BackgroundVideo />

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenDemo={() => setShowDemoModal(true)}
      />

      {/* Body Content */}
      {activeTab === 'landing' ? (
        <Hero
          onStartScan={(account) => {
            if (account) setTargetScanAccount(account);
            setActiveTab('scanner');
          }}
          onOpenDemoVideo={() => setShowDemoModal(true)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      ) : (
        <div className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 py-6 w-full max-w-7xl mx-auto">
          <ErrorBoundary fallbackTitle={`Error rendering ${activeTab} view`}>
            {activeTab === 'overview' && <OverviewPage onNavigate={setActiveTab} />}
            {activeTab === 'scanner' && (
              <ScannerPage
                initialAccount={targetScanAccount}
                onNavigate={setActiveTab}
                onCertificateIssued={handleCertificateIssued}
              />
            )}
            {activeTab === 'certificates' && (
              <CertificatesPage
                onNavigate={setActiveTab}
                onSelectShareCertificate={handleNavigateToShare}
              />
            )}
            {activeTab === 'auditor' && <AuditorPage initialCertId={selectedShareCertId} />}
            {activeTab === 'activity' && <ActivityPage />}
            {activeTab === 'settings' && <SettingsPage />}
          </ErrorBoundary>
        </div>
      )}

      {/* Video Demo & Protocol Walkthrough Modal */}
      <VideoDemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onLaunchScanner={() => {
          setShowDemoModal(false);
          setActiveTab('scanner');
        }}
      />

      {/* Connect Any NEAR Wallet Modal */}
      <ConnectWalletModal
        isOpen={isWalletModalOpen}
        onClose={closeWalletModal}
      />
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="ClearPass Global Application Error">
      <NearWalletProvider>
        <AppContent />
      </NearWalletProvider>
    </ErrorBoundary>
  );
};

export default App;
