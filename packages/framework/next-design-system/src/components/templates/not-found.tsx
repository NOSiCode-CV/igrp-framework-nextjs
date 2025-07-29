import Link from 'next/link';

interface IGRPTemplateNotFoundProps {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageClassName?: string;
  appCode?: string;
}

function IGRPTemplateNotFound({ appCode }: IGRPTemplateNotFoundProps) {
  console.log({ appCode });
  return (
    <div>
      <h1>404</h1>
      <h2>Página não encontrada</h2>
      <p>Desculpe, a página que você procurou não foi encontrada.</p>
      <Link href="/">Voltar à Página Inicial</Link>
    </div>
  );
}

export { IGRPTemplateNotFound, type IGRPTemplateNotFoundProps };
