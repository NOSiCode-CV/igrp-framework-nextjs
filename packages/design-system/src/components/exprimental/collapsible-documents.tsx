// import {
//   Collapsible as IGRPCollapsiblePrimitive,
//   CollapsibleTrigger as IGRPCollapsibleTriggerPrimitive,
//   CollapsibleContent as IGRPCollapsibleContentPrimitive,
// } from '../primitives/collapsible';
// import { cn } from '../../lib/utils';
// import { IGRPButton } from '../horizon/button';
// import { IGRPInputFile } from '../horizon/input/file';
// import { IGRPInputHidden } from '../horizon/input/hidden';
// import { IGRPLabel } from '../horizon/label';
// import { Fragment } from 'react';
// // import {UploadState} from "@myapp/components/upload-state";
// //import {uploadDocument} from "@myapp/hooks/use-contribuinte";

// async function handleUploadFile(
//   indexDoc: number,
//   e: any,
//   setUploadedFiles: (files: any) => void,
//   setIsUploading: (value: any) => void,
//   onAfterUpload: () => void,
// ): Promise<void | undefined> {
//   const file = e?.target?.files?.[0];
//   if (!file) return;

//   setUploadedFiles((prev: any) => ({
//     ...prev,
//     [indexDoc]: { file, uploaded: false },
//   }));

//   setIsUploading((prev: any) => ({
//     ...prev,
//     [indexDoc]: true,
//   }));

//   try {
//     const uploadResponse = await uploadDocument({ file });

//     setUploadedFiles((prev: any) => ({
//       ...prev,
//       [indexDoc]: {
//         file,
//         uploaded: true,
//         url: uploadResponse.fileId,
//       },
//     }));

//     onAfterUpload?.();
//   } catch (error) {
//     setUploadedFiles((prev: any) => {
//       const newState = { ...prev };
//       delete newState[indexDoc];
//       return newState;
//     });
//   } finally {
//     setIsUploading((prev: any) => ({
//       ...prev,
//       [indexDoc]: false,
//     }));
//   }
// }

// export function CollapsibleDocuments({
//   docTypes,
//   uploadedFiles,
//   setUploadedFiles,
//   isUploading,
//   setIsUploading,
//   onAfterUpload,
//   indexRef = 0,
// }: {
//   docTypes: Array<{
//     label?: string;
//     value?: number | string;
//     obrigatorio?: string;
//   }>;
//   uploadedFiles: any;
//   setUploadedFiles: (files: any) => void;
//   isUploading: any;
//   setIsUploading: (value: any) => void;
//   onAfterUpload: () => void;
//   indexRef?: number;
// }) {
//   return (
//     <div className="mx-auto w-full border last:border-b rounded-sm mb-4">
//       <IGRPCollapsiblePrimitive>
//         <IGRPCollapsibleTriggerPrimitive asChild>
//           <IGRPButton
//             variant={'ghost'}
//             size={'default'}
//             showIcon={true}
//             iconName="ChevronDown"
//             className={'group w-full justify-between gap-2'}
//             iconPlacement={'end'}
//           >
//             Documentos
//           </IGRPButton>
//         </IGRPCollapsibleTriggerPrimitive>

//         <IGRPCollapsibleContentPrimitive className="flex flex-col items-start gap-3 p-4 pt-2 text-sm">
//           <div className={cn('grid', 'grid-cols-3', 'md:grid-cols-3', 'lg:grid-cols-3', 'gap-3')}>
//             {docTypes.map(
//               (
//                 doc: {
//                   label?: string;
//                   value?: number | string;
//                   obrigatorio?: string;
//                 },
//                 index: number,
//               ) => (
//                 <Fragment key={indexRef * 100 + index}>
//                   <IGRPLabel
//                     id={`documentosFracao.${indexRef * 100 + index}.label`}
//                     label={doc.label}
//                     required={(doc?.obrigatorio || '').toUpperCase() === 'S'}
//                   />

//                   <IGRPInputFile
//                     id={`url`}
//                     accept="application/pdf"
//                     required={false}
//                     multiple={false}
//                     className={cn('col-span-1')}
//                     onChange={(e: any) =>
//                       handleUploadFile(
//                         indexRef * 100 + index,
//                         e,
//                         setUploadedFiles,
//                         setIsUploading,
//                         onAfterUpload,
//                       )
//                     }
//                   />

//                   {/* <UploadState
// 									isUploading={isUploading}
// 									uploadedFiles={uploadedFiles}
// 									index={(indexRef * 100) + index}
// 								/> */}

//                   <IGRPInputHidden
//                     id={`documentosFracao.${indexRef * 100 + index}.idTipoDocumento`}
//                     label="ID Tipo Documento"
//                     required={false}
//                     value={doc.value}
//                     className={cn('col-span-1')}
//                   />

//                   <IGRPInputHidden
//                     id={`documentosFracao.${indexRef * 100 + index}.url`}
//                     label="URL"
//                     required={false}
//                     className={cn('col-span-1')}
//                   />

//                   <IGRPInputHidden
//                     id={`documentosFracao.${indexRef * 100 + index}.id`}
//                     label="ID Documento"
//                     required={false}
//                     value={doc.value}
//                     className={cn('col-span-1')}
//                   />

//                   <IGRPInputHidden
//                     id={`documentosFracao.${indexRef * 100 + index}.descricaoTipoDocumento`}
//                     required={false}
//                     value={doc.label}
//                     className={cn('col-span-1')}
//                   />
//                 </Fragment>
//               ),
//             )}
//           </div>
//         </IGRPCollapsibleContentPrimitive>
//       </IGRPCollapsiblePrimitive>
//     </div>
//   );
// }
