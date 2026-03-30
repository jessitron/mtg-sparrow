import { storageSetItem } from './storage';

const SOUND_ENABLED_KEY = 'mtg-sparrow.sound.enabled';

let audioEl: HTMLAudioElement | null = null;

/**
 * Unlock audio playback on iOS Safari by playing a silent WAV
 * synchronously from a user gesture. Must be called from a direct
 * tap/click handler before any timer-triggered audio.
 */
export function unlockAudio(): void {
  const el = new Audio(
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
  );
  el.play().catch(() => {
    // Ignore — we're just unlocking the audio context
  });
  audioEl = el;
}

type RecordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => void;

export function isSoundEnabled(): boolean {
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  // Default to on if never set
  return stored !== 'false';
}

export function setSoundEnabled(enabled: boolean, recordEvent: RecordEvent): void {
  storageSetItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
  recordEvent('sound.toggle', {
    'sound.enabled': enabled,
  });
}

/**
 * Play pronunciation audio, only if sound is enabled.
 * For automatic playback (e.g. slide reveal).
 */
export async function playComboAudio(comboId: string): Promise<'success' | 'disabled' | 'error'> {
  if (!isSoundEnabled()) {
    return 'disabled';
  }
  return playAudio(comboId);
}

/**
 * Play pronunciation audio unconditionally.
 * For explicit user actions (e.g. combo page play button).
 */
export async function playAudio(comboId: string): Promise<'success' | 'error'> {
  try {
    if (audioEl) {
      audioEl.src = `/audio/${comboId}.mp3`;
      await audioEl.play();
    } else {
      const audio = new Audio(`/audio/${comboId}.mp3`);
      await audio.play();
    }
    return 'success';
  } catch {
    return 'error';
  }
}
