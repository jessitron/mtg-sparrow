import { storageSetItem } from './storage';

const SOUND_ENABLED_KEY = 'mtg-sparrow.sound.enabled';

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

// Single reusable Audio element — Firefox blocks play() on newly created
// Audio elements even from click handlers. Reusing one element with
// changing src avoids this and also prevents GC mid-playback.
const audioEl = new Audio();

/**
 * Play pronunciation audio, but only if sound is enabled.
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
    audioEl.pause();
    audioEl.src = `/audio/${comboId}.mp3`;
    await audioEl.play();
    return 'success';
  } catch {
    return 'error';
  }
}
