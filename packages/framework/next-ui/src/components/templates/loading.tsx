interface IGRPTemplateLoadingProps {
  appCode?: string;
}

function IGRPTemplateLoading({ appCode }: IGRPTemplateLoadingProps) {
  return (
    <>
      <div>Loading...</div>
      <span className="hidden">{appCode}</span>
    </>
  );
}

export { IGRPTemplateLoading, type IGRPTemplateLoadingProps };
