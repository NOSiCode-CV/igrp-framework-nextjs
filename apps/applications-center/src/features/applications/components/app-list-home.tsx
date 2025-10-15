"use client";

import { AppCenterNotFound } from "@/components/not-found";
import { AppCenterLoading } from "@/components/loading";
import { ApplicationCard } from "@/features/applications/components/app-card";
import { useApplications } from "@/features/applications/use-applications";
import {
  cn,
  IGRPDataTable,
  IGRPDataTableButtonLink,
  IGRPDataTableCellBadge,
  IGRPDataTableDropdownMenu,
  IGRPDataTableDropdownMenuAlert,
  IGRPDataTableDropdownMenuCustom,
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableFilterDropdown,
  IGRPDataTableFilterInput,
  IGRPDataTableRowAction,
} from "@igrp/igrp-framework-react-design-system";
import { ApplicationArgs } from "../app-schemas";

type Table1 = {
  title: string;
  processKey: string;
  deploymentDate: string;
  processDefinitionId: string;
  version: string;
  statusDesc: string;
  description: string;
};

export function ApplicationsListHome() {
  const { data: applications, isLoading, error } = useApplications();

  if (isLoading && !error)
    return <AppCenterLoading descrption="Carregando aplicações..." />;

  if (error) throw error;

  if (!applications || applications.length === 0) {
    return (
      <AppCenterNotFound
        iconName="AppWindow"
        title="Nenhuma aplicação encontrada."
      >
        Clique em &nbsp;
        <span className="font-semibold">“Nova Aplicação”</span>
      </AppCenterNotFound>
    );
  }

  const filteredApps = applications.filter((app) => app.type !== "SYSTEM");
  const activeApps = filteredApps
    .filter((app) => app.status === "ACTIVE")
    .slice(0, 6);

  const contentTabletable1: Table1[] = [
    {
      processDefinitionId: "e3e94579-c554-404d-a44d-060b1a3e8e01",
      processKey: "registar-contribuinte",
      title: "Registar Contribuinte",
      description: "",
      version: "10",
      statusDesc: "Publicado",
      deploymentDate: "01/09/2025",
    },
    {
      processDefinitionId: "a654641c-ca90-4f81-bc9d-e34fe05c5aab",
      processKey: "FALECIMENTO",
      title: "Falecimento",
      description: "",
      version: "9",
      statusDesc: "Publicado",
      deploymentDate: "27/08/2025",
    },
    {
      processDefinitionId: "3cb565b4-6676-4f18-b839-7279bde7cfc3",
      processKey: "SUSP",
      title: "",
      description: "",
      version: "3",
      statusDesc: "Rascunho",
      deploymentDate: "07/08/2025",
    },
    {
      processDefinitionId: "b20a7bf5-eeb5-4927-9f4b-42dee70f55a4",
      processKey: "SUSP",
      title: "Suspender Contribuinte",
      description: "",
      version: "1",
      statusDesc: "Rascunho",
      deploymentDate: "07/08/2025",
    },
    {
      processDefinitionId: "b0194d44-3f15-4191-b162-1abf81671cbe",
      processKey: "registar-contribuinte",
      title: "Registar Contribuinte",
      description: "",
      version: "",
      statusDesc: "Rascunho",
      deploymentDate: "",
    },
  ];

  return (
    <>
      {/* <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t'>
        {activeApps.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
          />
        ))}
      </div> */}

      <div className={cn(" border rounded-lg p-3")}>
        <IGRPDataTable<Table1, Table1>
          showFilter={true}
          showPagination={true}
          showToggleColumn={true}
          className={cn()}
          columns={[
            {
              header: "Process Name",
              accessorKey: "title",
              cell: ({ row }) => {
                return row.getValue("title");
              },
              enableColumnFilter: true,
            },
            {
              header: "Process Key",
              accessorKey: "processKey",
              cell: ({ row }) => {
                return row.getValue("processKey");
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: "Deployment Date",
              accessorKey: "deploymentDate",
              cell: ({ row }) => {
                return row.getValue("deploymentDate");
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: "Version",
              accessorKey: "version",
              cell: ({ row }) => {
                const rowData = row.original;

                return (
                  <IGRPDataTableCellBadge
                    label={row.original.version}
                    variant={`soft`}
                    badgeClassName={``}
                  ></IGRPDataTableCellBadge>
                );
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: "Status",
              accessorKey: "statusDesc",
              cell: ({ row }) => {
                const rowData = row.original;

                return (
                  <IGRPDataTableCellBadge
                    label={row.original.statusDesc}
                    variant={`soft`}
                    badgeClassName={``}
                  ></IGRPDataTableCellBadge>
                );
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              id: "tableActionListCell1",
              enableHiding: false,
              cell: ({ row }) => {
                const rowData = row.original;

                return (
                  <IGRPDataTableRowAction>
                    <IGRPDataTableButtonLink
                      labelTrigger={`Process Editor`}
                      href={`/process/${row.original.processDefinitionId}/editor`}
                      variant={`ghost`}
                      icon={`Workflow`}
                      className={cn()}
                      action={() => {}}
                    ></IGRPDataTableButtonLink>
                    <IGRPDataTableDropdownMenu
                      items={[
                        {
                          component: IGRPDataTableDropdownMenuCustom,
                          props: {
                            labelTrigger: `Edit Process`,
                            icon: `SquarePen`,
                            showIcon: true,
                            action: () => {},
                          },
                        },
                        {
                          component: IGRPDataTableDropdownMenuAlert,
                          props: {
                            modalTitle: `Delete Process Definition`,
                            labelTrigger: `Delete`,
                            icon: `Trash`,
                            showIcon: true,
                            showCancel: true,
                            labelCancel: `Cancel`,
                            variantCancel: `outline`,
                            showConfirm: true,
                            labelConfirm: `Confirm`,
                            variantConfirm: `destructive`,
                            onClickConfirm: () => {},
                            children: (
                              <>Do you want delete this process definition?</>
                            ),
                          },
                        },
                      ]}
                    ></IGRPDataTableDropdownMenu>
                  </IGRPDataTableRowAction>
                );
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
          ]}
          clientFilters={[
            {
              columnId: `title`,
              component: (column) => {
                console.log({ column2: column });
                return <IGRPDataTableFilterInput column={column} />;
              },
            },
          ]}
          data={contentTabletable1}
        />
      </div>
    </>
  );
}
