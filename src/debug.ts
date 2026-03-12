import { startSpan, endSpan, flushSpans } from './telemetry/telemetry';

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

  if (param === 'on' || param === 'off') {
    console.log(`[debug] ?debug=${param} detected — switching debug mode ${param}`);

    const span = startSpan('debug.mode_changed', {
      'debug.mode': param,
      'debug.source': 'url_param',
    });

    if (param === 'on') {
      localStorage.setItem(DEBUG_KEY, 'true');
    } else {
      localStorage.removeItem(DEBUG_KEY);
    }

    endSpan(span);

    url.searchParams.delete('debug');
    console.log(`[debug] flushing spans before reload...`);
    flushSpans().then(() => {
      console.log(`[debug] flush complete, reloading`);
      window.location.replace(url.toString());
    });
  } else {
    console.log(`[debug] debug mode is ${isDebugMode() ? 'ON' : 'off'}`);
  }
}

/**
 * Returns true if debug mode is currently enabled in localStorage.
 */
export function isDebugMode(): boolean {
  return localStorage.getItem(DEBUG_KEY) === 'true';
}
