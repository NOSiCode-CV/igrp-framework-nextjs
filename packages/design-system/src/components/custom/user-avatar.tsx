import { useId } from 'react';

import { Avatar, AvatarImage, AvatarFallback } from '../primitives/avatar';

interface IGRPUserAvatarProps {
  image?: string | null;
  alt?: string;
  fallbackContent: React.ReactNode;
  className?: string;
  fallbackClass?: string;
  name?: string;
  id?: string;
}
function IGRPUserAvatar({
  image,
  alt,
  fallbackContent,
  className,
  fallbackClass,
  name,
  id,
}: IGRPUserAvatarProps) {
  const _id = useId();
  const ref = name ?? id ?? _id
      
  return (
    <Avatar className={className} id={ref}>
      <AvatarImage src={image || undefined} alt={alt || 'Current User'} />
      <AvatarFallback className={fallbackClass}>{fallbackContent}</AvatarFallback>
    </Avatar>
  );
}

export { IGRPUserAvatar, type IGRPUserAvatarProps };
