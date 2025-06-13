interface IGRPFieldDescriptionProps {
  helperText?: string;
  error?: string;
}

function IGRPFieldDescription({ helperText, error }: IGRPFieldDescriptionProps) {
  return (
    <>
      {helperText && !error && (
        <p
          className='text-muted-foreground text-xs mt-1'
          role='note'
        >
          {helperText}
        </p>
      )}

      {error && (
        <p
          className='text-destructive text-xs mt-1'
          role='alert'
        >
          {error}
        </p>
      )}
    </>
  );
}

export { IGRPFieldDescription, type IGRPFieldDescriptionProps };
