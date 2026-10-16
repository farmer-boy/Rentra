import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { ApiError } from './api/api-error';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status !== undefined && error.status < 500) &&
        failureCount < 1,
    },
  },
});

window.addEventListener('rentra:auth-expired', () => queryClient.clear());
window.addEventListener('rentra:session-cleared', () => queryClient.clear());
window.addEventListener('rentra:session-changed', () => queryClient.clear());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);