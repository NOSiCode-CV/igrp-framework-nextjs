//TODO: review this if is not fullname
export const formattedName = (userName: string) =>
  userName
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

// TDOD: add locale
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const typeClass = (type: string) =>
  type === 'INTERNAL' ? 'bg-primary/10 text-primary' : 'bg-muted-foreground text-muted';

export function formatSlug(slug: string): string {
  if (slug.startsWith('/apps')) {
    return slug;
  }

  return `/apps/${slug}`;
}
