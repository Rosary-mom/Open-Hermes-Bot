// The local machine's name in the UI: "This Mac" on macOS, "This computer" on Windows.
export const IS_WINDOWS =
  typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);
export const MACHINE = IS_WINDOWS ? 'computer' : 'Mac';
