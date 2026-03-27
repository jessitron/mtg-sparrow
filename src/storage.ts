type RecordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => void;

let recordEvent: RecordEvent = () => {};

export function setStorageRecordEvent(fn: RecordEvent): void {
  recordEvent = fn;
}

export function storageSetItem(key: string, value: string): void {
  const before = localStorage.getItem(key) ?? '';
  localStorage.setItem(key, value);
  if (before === value) return;
  try {
    recordEvent('localStorage.update', {
      'storage.key': key,
      'storage.before': before,
      'storage.after': value,
      'storage.operation': 'setItem',
      'storage.adapter_version': 'v1',
    });
  } catch {}
}

export function storageRemoveItem(key: string): void {
  const before = localStorage.getItem(key) ?? '';
  localStorage.removeItem(key);
  try {
    recordEvent('localStorage.update', {
      'storage.key': key,
      'storage.before': before,
      'storage.after': '',
      'storage.operation': 'removeItem',
      'storage.adapter_version': 'v1',
    });
  } catch {}
}

export function storageClear(): void {
  localStorage.clear();
  try {
    recordEvent('localStorage.update', {
      'storage.key': '*',
      'storage.operation': 'clear',
      'storage.adapter_version': 'v1',
    });
  } catch {}
}
