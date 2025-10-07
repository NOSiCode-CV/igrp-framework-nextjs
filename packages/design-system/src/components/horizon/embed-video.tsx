import { cn } from '../../lib/utils';

import { IGRPCard,IGRPCardContent } from './card';

interface IGRPEmbedVideoProps {
  displayMode?: 'aspect-video' | 'aspect-square ' | 'aspect-auto' | 'aspect-3/2';
  src: string;
  title: string;
}
function convertYouTubeLink(url: string) {
    // Extrai o ID do vídeo (após "v=")
    const match = url.match(/v=([^&]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url; // se não for link válido, devolve o original
  }


function IGRPEmbedVideo({
    displayMode='aspect-auto',
    src = 'string',
    title= 'Video'
}:IGRPEmbedVideoProps){
    const srcembed = convertYouTubeLink(src);
    return <>
    <IGRPCard>
            <IGRPCardContent> 
            <iframe
                src={srcembed}
                className={cn("w-full h-full border-0",displayMode)}        
                title={title}
                loading="lazy"
                allowFullScreen
                />
            </IGRPCardContent>
    </IGRPCard>
    </>
}


export { IGRPEmbedVideo, type IGRPEmbedVideoProps };