export function getLocationOriginURL() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}
