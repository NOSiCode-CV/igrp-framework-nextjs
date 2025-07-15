export function toPascalCase(input) {
  return input.replace(/[^a-zA-Z0-9]+/g, ' ').split(' ').filter(Boolean).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
}
//# sourceMappingURL=toPascalCase.js.map