import { trace, context, Span, SpanStatusCode } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { init, flush } from './init';
import { isDebugMode } from '../debug';

let tracer: ReturnType<typeof trace.getTracer>;
let logger: ReturnType<typeof logs.getLogger>;
let sessionId: string;
let playerId: string;

const PLAYER_ID_KEY = 'mtg-sparrow.player.id';

const HONEYCOMB_API_KEY = 'hcaik_01khj5r4wm0ffgsz59cdn42zvxn4rrt4kgny3zbc8zehs115ccwtntdsbh';
const HONEYCOMB_DATASET = 'sparrow-deck';

function sendSessionHeartbeat(
  version: string,
  page: string | undefined,
  sid: string,
  pid: string,
): void {
  const payload = {
    'event.type': 'session.heartbeat',
    'event.source': 'direct',
    'session.id': sid,
    'player.id': pid,
    'page.hostname': window.location.hostname,
    'page.url': window.location.href,
    'page.path': window.location.pathname,
    'app.version': version,
    'app.page': page ?? '',
    'browser.language': navigator.language,
    'screen.width': window.screen.width,
    'screen.height': window.screen.height,
    'viewport.width': window.innerWidth,
    'viewport.height': window.innerHeight,
  };

  fetch(`https://api.honeycomb.io/1/events/${HONEYCOMB_DATASET}`, {
    method: 'POST',
    headers: {
      'Authorization': HONEYCOMB_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.warn('session heartbeat failed:', err);
  });
}

function generateId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function initTelemetry(version: string, page?: string, navigation?: string): void {
  const storedSession = sessionStorage.getItem('mtg-sparrow.session.id');
  sessionId = storedSession ?? generateId();
  if (!storedSession) {
    sessionStorage.setItem('mtg-sparrow.session.id', sessionId);
  }

  const storedPlayer = localStorage.getItem(PLAYER_ID_KEY);
  playerId = storedPlayer ?? generateId();
  if (!storedPlayer) {
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }

  if (!storedSession) {
    sendSessionHeartbeat(version, page, sessionId, playerId);
  }

  const resourceAttrs: Record<string, string> = {
    'mtg-sparrow.player.id': playerId,
  };
  if (page) resourceAttrs['app.page'] = page;
  if (navigation) resourceAttrs['app.navigation'] = navigation;

  // Capture UTM params for referral chain analysis
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmId = urlParams.get('utm_id');
  if (utmSource) resourceAttrs['utm.source'] = utmSource;
  if (utmId) resourceAttrs['utm.referral_session_id'] = utmId;
  resourceAttrs['app.debug'] = String(isDebugMode());

  // Screen and viewport dimensions for layout analysis
  resourceAttrs['screen.width'] = String(window.screen.width);
  resourceAttrs['screen.height'] = String(window.screen.height);
  resourceAttrs['viewport.width'] = String(window.innerWidth);
  resourceAttrs['viewport.height'] = String(window.innerHeight);

  init(version, sessionId, resourceAttrs);
  tracer = trace.getTracer('sparrow-deck', version);
  logger = logs.getLogger('sparrow-deck', version);
}

export function getSessionId(): string {
  return sessionId;
}

export function startSpan(
  name: string,
  attributes?: Record<string, string | number | boolean>,
): Span {
  return tracer.startSpan(name, { attributes });
}

export function startChildSpan(
  name: string,
  parent: Span,
  attributes?: Record<string, string | number | boolean>,
  startTime?: number,
): Span {
  const ctx = trace.setSpan(context.active(), parent);
  return tracer.startSpan(name, { attributes, startTime }, ctx);
}

export function emitLog(
  name: string,
  parentSpan?: Span,
  attributes?: Record<string, string | number | boolean>,
): void {
  const ctx = parentSpan ? trace.setSpan(context.active(), parentSpan) : undefined;
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    body: name,
    attributes: {
      'mtg-sparrow.session.id': sessionId,
      'mtg-sparrow.player.id': playerId,
      ...attributes,
    },
    context: ctx,
  });
}

export function getTraceId(span: Span): string {
  return span.spanContext().traceId;
}

export function endSpan(span: Span): void {
  span.end();
}

export function sendStartupSpan(version: string): Span {
  const span = startSpan('app.startup', { 'app.version': version, 'css.split': 'true', 'app.module_structure': 'extracted', 'data.tier_version': 'three_color_v1' });
  span.end();
  return span;
}

export function flushSpans(): Promise<void> {
  return flush();
}
