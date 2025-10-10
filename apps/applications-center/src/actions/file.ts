'use server';

import { UploadFileOptions } from '@igrp/platform-access-management-client-ts';
import { getClientAccess } from './access-client';

export async function getFileUrl(path: string) {
  const client = await getClientAccess();

  try {
    const result = await client.files.getFileUrl(path);
    return result.data;
  } catch (error) {
    console.error('[files-get] Não obter a imagem:', error);
    throw error;
  }
}

export async function uploadPublicFile(file: File | Blob, options: UploadFileOptions) {
  const client = await getClientAccess();  

  try {
    const result = await client.files.uploadPublicFile(file, options);
    return result.data;
  } catch (error) {
    console.error('[files-upload-public] Não possivel carregar o ficheiro:', error);
    throw error;
  }
}
export async function uploadPrivateFile(formData: FormData) {
  const client = await getClientAccess();

  const file = formData.get('file') as File | null
  const folder = formData.get('folder') as string | null
  const filename = formData.get('filename') as string | null

  if (!file) throw new Error('Missing file')
  if (!folder) throw new Error('Missing folder')

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const serverFile = new File([buffer], filename ?? file.name, {
    type: file.type,
    lastModified: Date.now(),
  })

  const options: UploadFileOptions = { folder }

  console.log({ serverFile, options });

  try {
    const result = await client.files.uploadPrivateFile(serverFile, options);
    return result.data;
  } catch (error) {
    console.error('[files-upload-private] Não possivel carregar o ficheiro:', error);
    throw error;
  }
}
