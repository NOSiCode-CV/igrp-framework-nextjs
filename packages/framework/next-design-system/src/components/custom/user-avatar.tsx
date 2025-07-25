import { Avatar, AvatarImage, AvatarFallback } from '../primitives/avatar';

interface IGRPUserAvatarProps {
  image?: string | null;
  alt?: string;
  fallbackContent: React.ReactNode;
  className?: string;
  fallbackClass?: string;
}
function IGRPUserAvatar({
  image,
  alt,
  fallbackContent,
  className,
  fallbackClass,
}: IGRPUserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={image || undefined} alt={alt || 'Current User'} />
      <AvatarFallback className={fallbackClass}>{fallbackContent}</AvatarFallback>
    </Avatar>
  );
}

export { IGRPUserAvatar, type IGRPUserAvatarProps };
