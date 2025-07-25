
interface IGRPTemplateLoadingProps {
  appCode?: string;
}

function IGRPTemplateLoading({ appCode }: IGRPTemplateLoadingProps) {
  console.log({ appCode });
  return <div>Loading...</div>
} 

export { IGRPTemplateLoading, type IGRPTemplateLoadingProps };