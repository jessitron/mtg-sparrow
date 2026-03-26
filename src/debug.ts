import { startSpan, endSpan, flushSpans } from './telemetry/telemetry';
import { storageSetItem, storageRemoveItem } from './storage';

const DEBUG_KEY = 'mtg-sparrow.debug';

/**
 * Check URL params for ?debug=on or ?debug=off. If found:
 * 1. Emit a span for the change
 * 2. Update localStorage
 * 3. Flush spans so the span is sent before reload
 * 4. Reload the page via location.replace() with ?debug stripped
 *
 * If no ?debug param, returns immediately (no-op).
 */
export function initDebugMode(): void {
  const url = new URL(window.location.href);
  const param = url.searchParams.get('debug');
  if (!param) {
    return;
  }

  const enabling = param === 'on' || param === 'true';
  const disabling = param === 'off' || param === 'false';

  if (enabling || disabling) {
    console.log(`[debug] ?debug=${param} detected — switching debug mode ${enabling ? 'on' : 'off'}`);

    const span = startSpan('debug.mode_changed', {
      'debug.mode': enabling ? 'on' : 'off',
      'debug.source': 'url_param',
    });

    if (enabling) {
      storageSetItem(DEBUG_KEY, 'true');
    } else {
      storageRemoveItem(DEBUG_KEY);
    }

    endSpan(span);

    url.searchParams.delete('debug');
    console.log(`[debug] showing debug modal, flushing spans...`);
    showDebugModal(enabling ? 'ACTIVATED' : 'DEACTIVATED');
    flushSpans().then(() => {
      console.log(`[debug] flush complete`);
    });
    setTimeout(() => {
      console.log(`[debug] reloading after delay`);
      window.location.replace(url.toString());
    }, 3000);
  } else {
    console.log(`[debug] debug mode is ${isDebugMode() ? 'ON' : 'OFF'}. Set with ?debug=on/true or ?debug=off/false in the URL.`);
  }
} 

/**
 * Returns true if debug mode is currently enabled in localStorage.
 */
export function isDebugMode(): boolean {
  return localStorage.getItem(DEBUG_KEY) === 'true';
}

/**
 * Shows a full-screen hacker-style modal indicating debug mode change.
 * Stays visible until the page reloads (~3 seconds).
 */
function showDebugModal(state: 'ACTIVATED' | 'DEACTIVATED'): void {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '99999',
    background: 'rgba(0, 0, 0, 0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '1rem',
  });

  const label = document.createElement('div');
  label.textContent = 'debug mode';
  Object.assign(label.style, {
    fontFamily: 'monospace',
    fontSize: '1rem',
    color: '#4ade80',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    opacity: '0.7',
  });

  const text = document.createElement('div');
  text.textContent = state;
  Object.assign(text.style, {
    fontFamily: 'monospace',
    fontSize: 'clamp(2.5rem, 10vw, 6rem)',
    fontWeight: 'bold',
    color: state === 'ACTIVATED' ? '#4ade80' : '#f87171',
    letterSpacing: '0.1em',
    animation: 'debug-pulse 0.6s ease-out forwards',
    transformOrigin: 'center',
  });

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes debug-pulse {
      0%   { transform: scale(0.3); opacity: 0; }
      60%  { transform: scale(1.08); opacity: 1; }
      80%  { transform: scale(0.97); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes debug-glow-green {
      0%, 100% { text-shadow: 0 0 12px #4ade80, 0 0 30px #4ade8088; }
      50%       { text-shadow: 0 0 24px #4ade80, 0 0 60px #4ade80aa; }
    }
    @keyframes debug-glow-red {
      0%, 100% { text-shadow: 0 0 12px #f87171, 0 0 30px #f8717188; }
      50%       { text-shadow: 0 0 24px #f87171, 0 0 60px #f87171aa; }
    }
  `;
  // Start glow animation after scale-in completes
  setTimeout(() => {
    const glowAnim = state === 'ACTIVATED' ? 'debug-glow-green' : 'debug-glow-red';
    text.style.animation = `${glowAnim} 1.2s ease-in-out infinite`;
  }, 600);

  overlay.appendChild(styleEl);
  overlay.appendChild(label);
  overlay.appendChild(text);
  document.body.appendChild(overlay);
}
