import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { useId } from 'react';

type IGRPVideoEmbedAllowFeature =
  | 'autoplay'
  | 'clipboard-write'
  | 'encrypted-media'
  | 'gyroscope'
  | 'picture-in-picture'
  | 'web-share'
  | 'accelerometer';

const videoVariants = cva('', {
  variants: {
    aspectRatio: {
      '1/1': 'aspect-square',
      '4/3': 'aspect-[4/3]',
      '16/9': 'aspect-video',
      '21/9': 'aspect-[21/9]',
      '3/2': 'aspect-[3/2]',
      auto: 'aspect-auto',
    },
  },
  defaultVariants: {
    aspectRatio: '16/9',
  },
});

interface IGRPVideoEmbedProps extends VariantProps<typeof videoVariants> {
  src: string;
  title: string;
  loading?: 'eager' | 'lazy';
  allow?: IGRPVideoEmbedAllowFeature[];
  allowFullScreen?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  className?: string;
  name?: string;
  start?: number;
}

function IGRPVideoEmbed({
  src,
  title,
  loading = 'lazy',
  allow = ['autoplay', 'encrypted-media', 'picture-in-picture'],
  allowFullScreen = true,
  autoplay = false,
  muted = false,
  controls = true,
  loop = false,
  className,
  name,
  start = 0,
  aspectRatio = '16/9',
}: IGRPVideoEmbedProps) {
  const id = useId();
  const ref = name || id;

  let videoUrl: URL;
  try {
    videoUrl = new URL(src);
  } catch (error) {
    console.error('[VideoEmbed] Invalid URL provided:', src);
    return (
      <div
        className={cn(
          'w-full overflow-hidden bg-muted flex items-center justify-center p-8',
          videoVariants({ aspectRatio }),
          className,
        )}
      >
        <p className="text-muted-foreground text-sm">Invalid video URL</p>
      </div>
    );
  }

  if (start > 0) {
    videoUrl.searchParams.set('start', start.toString());
  }

  videoUrl.searchParams.set('autoplay', autoplay ? '1' : '0');
  videoUrl.searchParams.set('mute', muted ? '1' : '0');
  videoUrl.searchParams.set('controls', controls ? '1' : '0');
  videoUrl.searchParams.set('loop', loop ? '1' : '0');

  const allowValue = allow.join('; ');

  return (
    <div className={cn('w-full overflow-hidden', className)} id={ref}>
      <iframe
        key={src}
        src={videoUrl.toString()}
        className={cn('w-full h-full border-0', videoVariants({ aspectRatio }))}
        title={title}
        loading={loading}
        allowFullScreen={allowFullScreen}
        allow={allowValue}
        referrerPolicy="strict-origin-when-cross-origin"
        name={name}
      />
    </div>
  );
}

export { IGRPVideoEmbed, type IGRPVideoEmbedProps, type IGRPVideoEmbedAllowFeature };
