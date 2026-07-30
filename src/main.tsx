import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/app';
import '@/styles/index.css';

const root = document.querySelector<HTMLDivElement>('#root');

if (root === null) {
  throw new Error('Missing #root application mount point.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
