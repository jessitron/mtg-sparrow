import { trace, context, Span, SpanStatusCode } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { init, getProvider } from './init';
import { isDebugMode } from '../debug';

let tracer: ReturnType<typeof trace.getTracer>;
let logger: ReturnType<typeof logs.getLogger>;
let sessionId: string;
let playerId: string;

const PLAYER_ID_KEY = 'mtg-sparrow.player.id';

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

export function addSpanEvent(
  span: Span,
  name: string,
  attributes?: Record<string, string | number | boolean>,
): void {
  span.addEvent(name, attributes);
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
    attributes,
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
  const provider = getProvider();
  if (provider && typeof provider.forceFlush === 'function') {
    return provider.forceFlush().catch(() => {});
  }
  return Promise.resolve();
}
