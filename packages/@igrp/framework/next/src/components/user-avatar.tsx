import { Avatar, AvatarFallback, AvatarImage } from './primitives/avatar';

interface UserAvatarProps {
  image?: string | null;
  alt?: string;
  fallbackContent: React.ReactNode;
  className?: string;
  fallbackClass?: string;
}
export function UserAvatar({
  image,
  alt,
  fallbackContent,
  className,
  fallbackClass,
}: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage
        src={image || undefined}
        alt={alt || 'Current User'}
      />
      <AvatarFallback className={fallbackClass}>{fallbackContent}</AvatarFallback>
    </Avatar>
  );
}
