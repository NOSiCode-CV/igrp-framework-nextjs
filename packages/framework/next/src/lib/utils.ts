/**
 * Converts a string to an uppercase identifier by:
 * 1. Converting to uppercase
 * 2. Replacing any non-alphanumeric characters with underscores
 *
 * @param input - The string to convert
 * @returns An uppercase identifier string
 *
 * @example
 * toUpperCaseIdentifier("my-app") // "MY_APP"
 * toUpperCaseIdentifier("My App") // "MY_APP"
 * toUpperCaseIdentifier("app123") // "APP123"
 */
export function toUpperCaseIdentifier(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}
