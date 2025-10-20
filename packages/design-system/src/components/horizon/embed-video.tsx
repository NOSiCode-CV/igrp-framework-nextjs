import { cn } from '../../lib/utils';

type AllowFeature = 
  | 'autoplay'
  | 'clipboard-write'
  | 'encrypted-media'
  | 'gyroscope'
  | 'picture-in-picture';

interface IGRPEmbedVideoProps {
  displayMode?:string;
  src: string;
  title: string;
  loading?: "eager" | "lazy" | undefined;
  allow?: AllowFeature[] | string;
  allowFullScreen: boolean;
  allowTransparency: boolean;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean
}


function IGRPEmbedVideo({
    displayMode = 'aspect-auto',
    src,
    title,
    loading = undefined,
    allow,
    allowFullScreen,
    allowTransparency,
    autoplay = false,
    muted = false,
    controls = true,
    loop = false,
}:IGRPEmbedVideoProps){

  const baseUrl = src.split('?')[0];

  const allowValue = Array.isArray(allow) ? allow.join(' ') : allow;

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    controls: controls ? '1' : '0',
    loop: loop ? '1' : '0',
  });

  const finalSrc = `${baseUrl}?${params.toString()}`;

  const displayNumber = {
    '1/1':'aspect-square',
    '4/3':'aspect-[4/3]',
    '16/9':'aspect-16/9',
    '21/9':'aspect-21/9',
    '3/2':'aspect-3/2',
    'auto':'aspect-auto',
  }[displayMode]
    return <div className='w-full overflow-hidden'>   
      <iframe
        key={`${src}-${allowFullScreen}-${allow}-${allowTransparency}-${loading}`}
        src={finalSrc}
        className={cn("w-full h-full border-0",displayNumber)}        
        title={title}
        loading={loading}
        allowFullScreen={allowFullScreen}
        allowTransparency={allowTransparency}
        allow={allowValue}
      />
    </div>
}


export { IGRPEmbedVideo, type IGRPEmbedVideoProps };