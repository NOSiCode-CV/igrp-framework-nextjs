import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';

interface IGRPTemplateLoadingProps {
  appCode?: string;
}

function IGRPTemplateLoading({ appCode }: IGRPTemplateLoadingProps) {
  return (
    <>
      <div className="w-full h-full flex items-center justify-center py-10">
        <div className="text-center text-primary">
          <IGRPIcon
            iconName="LoaderCircle"
            strokeWidth={1}
            className="size-16 animate-spin mx-auto mb-4"
          />
          <p className="text-primary">Aguarde...</p>
          <p className="text-primary hidden">iGRP {appCode}</p>
        </div>
      </div>
    </>
  );
}

export { IGRPTemplateLoading, type IGRPTemplateLoadingProps };
