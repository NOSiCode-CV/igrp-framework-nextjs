import { BackButton } from '@/components/back-button';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  linkBackButton?: string;
  showActions?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  showBackButton = false,
  linkBackButton = '/',
  showActions = false,
  children,
}: PageHeaderProps) {
  return (
    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          {showBackButton && <BackButton href={linkBackButton} />}

          <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
        </div>
      </div>
      {showActions && (
        <div className='flex flex-col sm:flex-row sm:items-center gap-2'>{children}</div>
      )}
    </div>
  );
}
