import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {ErrorBoundary} from './logging/ErrorBoundary';
import './styles/global.css';

window.addEventListener('unhandledrejection', event => {
  const reason = event.reason;
  console.error(
    '[vera-admin] unhandledrejection',
    reason instanceof Error ? reason.message : String(reason),
    reason instanceof Error ? reason.stack : undefined,
  );
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
