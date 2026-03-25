import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../styles/index.css';

const installWuiIconSizeGuard = () => {
  if (typeof window === 'undefined' || !window.customElements) return;

  window.customElements.whenDefined('wui-icon').then(() => {
    const wuiIconCtor = window.customElements.get('wui-icon') as {
      prototype?: {
        render?: (...args: unknown[]) => unknown;
        __wlgPatchedSizeGuard?: boolean;
        size?: unknown;
      };
    } | undefined;

    const prototype = wuiIconCtor?.prototype;
    if (!prototype?.render || prototype.__wlgPatchedSizeGuard) return;

    const originalRender = prototype.render;

    prototype.render = function patchedWuiIconRender(...args: unknown[]) {
      if (typeof this.size !== 'string' || this.size.trim() === '') {
        this.size = 'md';
      }
      return originalRender.apply(this, args);
    };

    prototype.__wlgPatchedSizeGuard = true;
  });
};

installWuiIconSizeGuard();

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
