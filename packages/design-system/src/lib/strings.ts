/**
 * Remove all non-alphabetic characters from the input string.
 * This will remove all spaces, numbers, and special characters, leaving only letters.
 *
 * @param {string} input The string to clean.
 * @returns {string} The cleaned string.
 */
export function igrpCleanString(input: string | null | undefined): string {
  if (!input) return '';
  return input.replace(/[^a-zA-Z]/g, '') as string;
}