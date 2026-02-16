import { trace, context, Span, SpanStatusCode } from '@opentelemetry/api';
import { init, getProvider } from './init';

let tracer: ReturnType<typeof trace.getTracer>;

export function initTelemetry(version: string): void {
  init(version);
  tracer = trace.getTracer('sparrow-deck', version);
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
): Span {
  const ctx = trace.setSpan(context.active(), parent);
  return tracer.startSpan(name, { attributes }, ctx);
}

export function endSpan(span: Span): void {
  span.end();
}

export function sendStartupSpan(version: string): void {
  const span = startSpan('app.startup', { 'app.version': version });
  span.end();
}

export function flushSpans(): void {
  const provider = getProvider();
  if (provider) {
    provider.forceFlush();
  }
}
