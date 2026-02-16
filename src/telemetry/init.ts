import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web';
import { trace } from '@opentelemetry/api';

let sdk: HoneycombWebSDK | null = null;

export function init(version: string): void {
  if (sdk) return;

  sdk = new HoneycombWebSDK({
    apiKey: 'hcaik_01khj5r4wm0ffgsz59cdn42zvxn4rrt4kgny3zbc8zehs115ccwtntdsbh',
    serviceName: 'sparrow-deck',
    instrumentations: [], // Manual instrumentation only (DEC-020)
    resourceAttributes: {
      'service.version': version,
      'browser.language': navigator.language,
      'browser.platform': navigator.platform,
    },
  });

  sdk.start();
}

export function getProvider() {
  return trace.getTracerProvider() as any;
}
