import React, { useState } from 'react';
import { NearWalletProvider } from './wallet/NearWalletContext.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { Navbar } from './components/Navbar.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { ScannerPage } from './pages/ScannerPage.js';
import { CertificatesPage } from './pages/CertificatesPage.js';
import { AuditorPage } from './pages/AuditorPage.js';
import { ActivityPage } from './pages/ActivityPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { VerificationCertificate } from './types/index.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedShareCertId, setSelectedShareCertId] = useState<string>('');

  const handleNavigateToShare = (certId: string) => {
    setSelectedShareCertId(certId);
    setActiveTab('auditor');
  };

  const handleCertificateIssued = (cert: VerificationCertificate) => {
    setSelectedShareCertId(cert.certificateId);
  };

  return (
    <ErrorBoundary fallbackTitle="ClearPass Global Application Error">
      <NearWalletProvider>
        <div className="app-container">
          <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

          <main className="main-content">
            <ErrorBoundary fallbackTitle={`Error rendering ${activeTab} view`}>
              {activeTab === 'overview' && <OverviewPage onNavigate={setActiveTab} />}
              {activeTab === 'scanner' && (
                <ScannerPage
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
          </main>

          <footer
            style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '24px 20px',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#64748b',
              background: 'var(--bg-primary)',
            }}
          >
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <strong style={{ color: '#f0fdf4' }}>ClearPass Protocol</strong> — Privacy-Preserving Fund Risk Verification on NEAR
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ color: '#34d399' }}>NEAR Testnet</span>
                <span>Deterministic Rules Engine</span>
                <span>Ed25519 Cryptographic Proof</span>
              </div>
            </div>
          </footer>
        </div>
      </NearWalletProvider>
    </ErrorBoundary>
  );
};

export default App;

