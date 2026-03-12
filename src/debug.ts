const DEBUG_KEY = 'mtg-sparrow.debug';

/**
 * Check URL params for ?debug=on or ?debug=off, update localStorage accordingly,
 * then strip the param from the URL so it doesn't linger in the address bar.
 * Returns true if debug mode is active after initialization.
 */
export function initDebugMode(): boolean {
  const url = new URL(window.location.href);
  const param = url.searchParams.get('debug');

  if (param === 'on') {
    localStorage.setItem(DEBUG_KEY, 'true');
    url.searchParams.delete('debug');
    window.history.replaceState(null, '', url.toString());
  } else if (param === 'off') {
    localStorage.removeItem(DEBUG_KEY);
    url.searchParams.delete('debug');
    window.history.replaceState(null, '', url.toString());
  }

  return isDebugMode();
}

/**
 * Returns true if debug mode is currently enabled in localStorage.
 */
export function isDebugMode(): boolean {
  return localStorage.getItem(DEBUG_KEY) === 'true';
}
