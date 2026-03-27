/**
 * Standalone telemetry entry point for static combo pages (combo/*.html).
 * Initializes documentLoad instrumentation, sets up a logger for event recording,
 * and wires the shared hamburger menu.
 */

import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { APP_VERSION } from './version.js';
import { wireMenu } from './ui/menu.js';

declare global {
  interface Window {
    recordEvent: (name: string, attrs?: Record<string, string | number | boolean>) => void;
  }
}

// Parse combo ID from data attribute (preferred) or URL
function getComboId(): string {
  const bodyData = document.body.getAttribute('data-combo-id');
  if (bodyData) return bodyData;
  // Fallback: parse from URL path e.g. "/combo/rakdos.html"
  const match = location.pathname.match(/\/combo\/([^/]+)\.html/);
  return match ? match[1] : 'unknown';
}

// Session ID — same pattern as main telemetry.ts
function getSessionId(): string {
  const key = 'mtg-sparrow.session.id';
  const stored = sessionStorage.getItem(key);
  if (stored) return stored;
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(key, id);
  return id;
}

const comboId = getComboId();
const sessionId = getSessionId();

const sdk = new HoneycombWebSDK({
  apiKey: 'hcaik_01khj5r4wm0ffgsz59cdn42zvxn4rrt4kgny3zbc8zehs115ccwtntdsbh',
  serviceName: 'sparrow-deck',
  instrumentations: [new DocumentLoadInstrumentation()],
  resourceAttributes: {
    'service.version': APP_VERSION,
    'app.page': 'combo',
    'combo.id': comboId,
    'mtg-sparrow.session.id': sessionId,
  },
});

sdk.start();

// Logger-based recordEvent — consistent with main app log events
const logger = logs.getLogger('combo-telemetry', APP_VERSION);

function recordEvent(name: string, attrs?: Record<string, string | number | boolean>): void {
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    body: name,
    attributes: attrs,
  });
}

// Expose on window for any inline scripts in combo pages
window.recordEvent = recordEvent;

// Wire the shared hamburger menu
wireMenu({
  appVersion: APP_VERSION,
  recordEvent,
  getSessionId,
  showResetProgress: false,
  showTraceLink: false,
});
