// TODO: do this with Skeleton component
export function PermissionLoading() {
  return (
    <div className='grid gap-4 animate-pulse'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className='h-12 rounded-lg bg-muted'
        />
      ))}
    </div>
  );
}
