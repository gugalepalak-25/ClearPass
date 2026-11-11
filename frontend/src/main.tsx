import { Buffer } from 'buffer';

// Polyfill Buffer and global for NEAR SDK packages in browser environment
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('[ClearPass] Root element #root was not found in the DOM.');
}
