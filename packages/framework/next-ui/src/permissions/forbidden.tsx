'use client';

export interface IGRPForbiddenProps {
  /** pt-PT default; override for other locales. */
  title?: string;
  description?: string;
}

/** 403 screen. Semantic tokens only; pt-PT defaults exposed as props. */
export function IGRPForbidden({
  title = 'Acesso negado',
  description = 'Não tem permissão para aceder a este conteúdo.',
}: IGRPForbiddenProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-6xl font-bold text-muted-foreground">403</p>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-md text-muted-foreground">{description}</p>
    </div>
  );
}
