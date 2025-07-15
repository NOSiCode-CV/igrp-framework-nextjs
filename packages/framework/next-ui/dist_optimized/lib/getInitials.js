export const getInitials = username => {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() ?? '';
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
};
//# sourceMappingURL=getInitials.js.map