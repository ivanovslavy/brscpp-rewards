import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './components/ThemeContext';
import { config } from './config/wagmi';
import './i18n/i18n';
import './index.css';
import App from './App';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--card-bg, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
              }}
            />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
