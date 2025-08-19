import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";

export function ApplicationNotFound() {
  return (
    <div className="flex flex-col items-center py-10">
      <IGRPIcon iconName='AppWindow' strokeWidth={0.2} className="size-50" />
      <div className="text-center">
        <div className="text-xl font-semibold tracking-tight">
          Nenhuma aplicação encontrada.
        </div>
        <div className="text-lg font-light tracking-tight">
          Clique no botão&nbsp;
          <span className="font-semibold">“Nova Aplicação”</span>
        </div>
      </div>
    </div>
  )
} 