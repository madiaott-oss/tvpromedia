import * as React from 'react';

/**
 * Universal shim for `react-is` to guarantee 100% build compatibility 
 * on all Node / VPS / Rollup environments (avoids Rollup failed to resolve import "react-is").
 */
export function isFragment(object: any): boolean {
  return Boolean(object && object.type === React.Fragment);
}

export function isElement(object: any): boolean {
  return React.isValidElement(object);
}

export function isValidElementType(type: any): boolean {
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    type === React.Fragment ||
    type === React.Profiler ||
    type === React.StrictMode ||
    type === React.Suspense ||
    (typeof type === 'object' && type !== null)
  );
}

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

export function isContextConsumer(object: any): boolean {
  return Boolean(object && object.$$typeof === ContextConsumer);
}

export function isContextProvider(object: any): boolean {
  return Boolean(object && object.$$typeof === ContextProvider);
}

export function isForwardRef(object: any): boolean {
  return Boolean(object && object.$$typeof === ForwardRef);
}

export function isLazy(object: any): boolean {
  return Boolean(object && object.$$typeof === Lazy);
}

export function isMemo(object: any): boolean {
  return Boolean(object && object.$$typeof === Memo);
}

export function isPortal(object: any): boolean {
  return Boolean(object && object.$$typeof === Portal);
}

export default {
  isFragment,
  isElement,
  isValidElementType,
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
  isContextConsumer,
  isContextProvider,
  isForwardRef,
  isLazy,
  isMemo,
  isPortal,
};
