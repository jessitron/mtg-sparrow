/**
 * Standalone telemetry entry point for static combo pages (combo/*.html).
 * Initializes documentLoad instrumentation and exposes window.recordEvent
 * for future inline interactivity (e.g. share button).
 */

import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { trace } from '@opentelemetry/api';
import { APP_VERSION } from './version.js';

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

const comboId = getComboId();

const sdk = new HoneycombWebSDK({
  apiKey: 'hcaik_01khj5r4wm0ffgsz59cdn42zvxn4rrt4kgny3zbc8zehs115ccwtntdsbh',
  serviceName: 'sparrow-deck',
  instrumentations: [new DocumentLoadInstrumentation()],
  resourceAttributes: {
    'service.version': APP_VERSION,
    'app.page': 'combo',
    'combo.id': comboId,
  },
});

sdk.start();

window.recordEvent = function (name: string, attrs?: Record<string, string | number | boolean>): void {
  const tracer = trace.getTracer('combo-telemetry');
  const span = tracer.startSpan(name);
  if (attrs) {
    span.setAttributes(attrs);
  }
  span.end();
  sdk.forceFlush().catch(() => {/* best effort */});
};
