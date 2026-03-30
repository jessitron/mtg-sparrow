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
import { playAudio } from './audio.js';

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

// Player ID — same pattern as main telemetry.ts (persists across sessions via localStorage)
function getPlayerId(): string {
  const key = 'mtg-sparrow.player.id';
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(key, id);
  return id;
}

const comboId = getComboId();
const sessionId = getSessionId();
const playerId = getPlayerId();

const sdk = new HoneycombWebSDK({
  endpoint: 'https://mtg-sparrow.jessitron.honeydemo.io',
  serviceName: 'sparrow-deck',
  instrumentations: [new DocumentLoadInstrumentation({ ignoreNetworkEvents: true })],
  resourceAttributes: {
    'service.version': APP_VERSION,
    'app.page': 'combo',
    'combo.id': comboId,
    'mtg-sparrow.session.id': sessionId,
    'mtg-sparrow.player.id': playerId,
  },
});

sdk.start();

// Logger-based recordEvent — consistent with main app log events
const logger = logs.getLogger('combo-telemetry', APP_VERSION);

function recordEvent(name: string, attrs?: Record<string, string | number | boolean>): void {
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    body: name,
    attributes: {
      'mtg-sparrow.session.id': sessionId,
      'mtg-sparrow.player.id': playerId,
      ...attrs,
    },
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

// Inject pronunciation play button inline with the combo name (skip on index page)
// Must wait for DOM — the script tag is above .combo-name in the HTML
document.addEventListener('DOMContentLoaded', () => {
  const comboNameEl = document.querySelector('.combo-name');
  if (comboNameEl && comboId !== 'index') {
    const playBtn = document.createElement('button');
    playBtn.className = 'combo-play-btn';
    playBtn.title = `Hear "${comboNameEl.textContent}" pronounced`;
    playBtn.setAttribute('aria-label', `Play pronunciation of ${comboNameEl.textContent}`);
    playBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>`;

    playBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      playAudio(comboId).then((result) => {
        recordEvent('sound.play', {
          'sound.combo_id': comboId,
          'sound.context': 'combo-page',
          'sound.play_result': result,
        });
      });
    });

    comboNameEl.appendChild(playBtn);
  }
});
