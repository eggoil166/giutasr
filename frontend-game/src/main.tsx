import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppWithTest from './AppWithTest.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithTest />
  </StrictMode>
);
