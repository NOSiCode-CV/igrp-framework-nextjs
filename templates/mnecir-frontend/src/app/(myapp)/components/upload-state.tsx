import { UploadingFiles, UploadingState } from "../types";

function UploadState({
  isUploading,
  uploadedFiles,
  index,
}: {
  isUploading: UploadingState;
  uploadedFiles: UploadingFiles;
  index: number;
}) {
  return (
    <>
      {isUploading[index] && (
        <div className="col-span-1 flex items-center text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Enviando arquivo...
        </div>
      )}
      {uploadedFiles[index]?.uploaded && (
        <div className="col-span-1 flex items-center text-sm text-green-600">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Arquivo enviado: {uploadedFiles[index].file.name}
        </div>
      )}
    </>
  );
}

export { UploadState };
