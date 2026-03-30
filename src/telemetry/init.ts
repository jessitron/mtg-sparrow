import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';

let sdk: HoneycombWebSDK | null = null;

export function init(version: string, sessionId: string, resourceAttrs?: Record<string, string>): void {
  if (sdk) return;

  sdk = new HoneycombWebSDK({
    endpoint: 'https://mtg-sparrow.jessitron.honeydemo.io',
    serviceName: 'sparrow-deck',
    instrumentations: [new DocumentLoadInstrumentation({ ignoreNetworkEvents: true })],
    resourceAttributes: {
      'service.version': version,
      'browser.language': navigator.language,
      'browser.platform': navigator.platform,
      'mtg-sparrow.session.id': sessionId,
      ...resourceAttrs,
    },
  });

  sdk.start();
}

export function flush(): Promise<void> {
  if (sdk) {
    return sdk.forceFlush();
  }
  console.warn('Telemetry SDK not initialized, cannot flush');
  return Promise.reject(new Error('Telemetry SDK not initialized'));
}
