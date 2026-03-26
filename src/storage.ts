import { emitLog } from './telemetry/telemetry';

export function storageSetItem(key: string, value: string): void {
  localStorage.setItem(key, value);
  try {
    emitLog('localStorage.update', undefined, {
      'storage.key': key,
      'storage.value': value,
      'storage.operation': 'setItem',
      'storage.adapter_version': 'v1',
    });
  } catch {}
}

export function storageRemoveItem(key: string): void {
  localStorage.removeItem(key);
  try {
    emitLog('localStorage.update', undefined, {
      'storage.key': key,
      'storage.operation': 'removeItem',
      'storage.adapter_version': 'v1',
    });
  } catch {}
}

export function storageClear(): void {
  localStorage.clear();
  try {
    emitLog('localStorage.update', undefined, {
      'storage.key': '*',
      'storage.operation': 'clear',
      'storage.adapter_version': 'v1',
    });
  } catch {}
}
