
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Critical Error: Root element not found");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error("React Mounting Error:", error);
    rootElement.innerHTML = `<div style="color: white; background: #000; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; padding: 20px;">
      <div>
        <h1 style="color: #ef4444;">System Boot Failure</h1>
        <p style="opacity: 0.6;">Uplink could not be established. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="background: white; color: black; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; margin-top: 20px;">Retry Connect</button>
      </div>
    </div>`;
  }
};

// Ensure DOM is ready before rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
