import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Universal virtual module plugin for `react-is`.
 * Intercepts any Rollup/Vite resolution of "react-is" from recharts or other libraries,
 * eliminating "Rollup failed to resolve import react-is" completely across all VPS and production builds.
 */
function reactIsPlugin(): Plugin {
  const virtualId = 'react-is';
  const resolvedVirtualId = '\0' + virtualId;

  return {
    name: 'vite-plugin-react-is-virtual',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'react-is' || id.startsWith('react-is/')) {
        return resolvedVirtualId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedVirtualId) {
        return `
import * as React from 'react';

export const Fragment = React.Fragment;
export const StrictMode = React.StrictMode;
export const Profiler = React.Profiler;
export const Suspense = React.Suspense;

export const ContextConsumer = Symbol.for('react.context');
export const ContextProvider = Symbol.for('react.provider');
export const Element = Symbol.for('react.element');
export const ForwardRef = Symbol.for('react.forward_ref');
export const Lazy = Symbol.for('react.lazy');
export const Memo = Symbol.for('react.memo');
export const Portal = Symbol.for('react.portal');

export const isFragment = (obj) => Boolean(obj && obj.type === React.Fragment);
export const isElement = (obj) => React.isValidElement(obj);
export const isValidElementType = (type) => 
  typeof type === 'string' ||
  typeof type === 'function' ||
  type === React.Fragment ||
  type === React.Profiler ||
  type === React.StrictMode ||
  type === React.Suspense ||
  (typeof type === 'object' && type !== null);

export const isContextConsumer = (obj) => Boolean(obj && obj.$$typeof === ContextConsumer);
export const isContextProvider = (obj) => Boolean(obj && obj.$$typeof === ContextProvider);
export const isForwardRef = (obj) => Boolean(obj && obj.$$typeof === ForwardRef);
export const isLazy = (obj) => Boolean(obj && obj.$$typeof === Lazy);
export const isMemo = (obj) => Boolean(obj && obj.$$typeof === Memo);
export const isPortal = (obj) => Boolean(obj && obj.$$typeof === Portal);

export default {
  Fragment,
  StrictMode,
  Profiler,
  Suspense,
  ContextConsumer,
  ContextProvider,
  Element,
  ForwardRef,
  Lazy,
  Memo,
  Portal,
  isFragment,
  isElement,
  isValidElementType,
  isContextConsumer,
  isContextProvider,
  isForwardRef,
  isLazy,
  isMemo,
  isPortal,
};
`;
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [reactIsPlugin(), react(), tailwindcss()],
    resolve: {
      alias: [
        { find: /^react-is(\/.*)?$/, replacement: path.resolve(__dirname, 'src/shims/react-is.ts') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['recharts'],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['tvpromedia.com', 'www.tvpromedia.com', 'localhost', '.tvpromedia.com', 'all'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['tvpromedia.com', 'www.tvpromedia.com', 'localhost', '.tvpromedia.com', 'all'],
    },
  };
});
