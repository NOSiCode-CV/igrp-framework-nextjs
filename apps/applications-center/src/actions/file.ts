'use server';

import { getClientAccess } from './access-client';

export async function getFileUrl(path: string) {
  const client = await getClientAccess();

  console.log({ path })

  try {
    const result = await client.files.getFileUrl(path); 
    console.log({ FileData: result.data})
   
    return result.data;
  } catch (error) {
    console.error('[files] Não obter a imagem:', error);
    throw error;
  }
}
