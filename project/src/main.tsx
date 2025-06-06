import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { EmotionProvider } from './context/EmotionContext';
import { SessionProvider } from './context/SessionContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SessionProvider>
          <EmotionProvider>
            <App />
          </EmotionProvider>
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);