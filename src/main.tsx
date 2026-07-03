import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { OSProvider } from './contexts/OSContext';
import { TelemetryProvider } from './contexts/TelemetryContext';
import { ThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <TelemetryProvider>
      <OSProvider>
        <App />
      </OSProvider>
    </TelemetryProvider>
  </ThemeProvider>
);
