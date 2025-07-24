interface IGRPCustomIconProps {
  className?: string;
}
function IGRPCircleFull({ className }: IGRPCustomIconProps) {
  return (
    <svg
      width='4'
      height='4'
      fill='currentColor'
      viewBox='0 0 8 8'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      aria-hidden='true'
    >
      <circle
        cx='4'
        cy='4'
        r='4'
      />
    </svg>
  );
}

export { IGRPCircleFull, type IGRPCustomIconProps };
