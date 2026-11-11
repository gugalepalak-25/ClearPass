import './polyfills.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err: any) {
    console.error('[ClearPass] Render error:', err);
    rootElement.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#030712;color:#fff;font-family:sans-serif;padding:20px;text-align:center;">
        <div>
          <h2 style="color:#f43f5e;margin-bottom:12px;">ClearPass Initialization Notice</h2>
          <p style="color:#94a3b8;margin-bottom:16px;">${err?.message || 'Application failed to render'}</p>
          <button onclick="window.location.reload()" style="background:#10b981;color:#000;padding:8px 18px;border-radius:9999px;font-weight:600;border:none;cursor:pointer;">Reload App</button>
        </div>
      </div>
    `;
  }
} else {
  console.error('[ClearPass] Root element #root was not found in the DOM.');
}
