/** Converts a string to PascalCase (e.g. "hello world" → "HelloWorld"). */
export function igrpToPascalCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
