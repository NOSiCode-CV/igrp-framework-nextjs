import  { AspectRatio} from '@radix-ui/react-aspect-ratio';
import type { IGRPImageAttributes } from '../../../types'
import Image from 'next/image'
import { cn } from '../../../lib/utils';

interface IGRPImageProps extends IGRPImageAttributes {
    src: string; 
    alt: string;
    labelClassName: string;
    ratio: number;
    width: number;
    height: number;
    borderRadius?: 'rounded-none' | 'rounded-sm' | 'rounded' | 'rounded-md' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full';
}

function IGRPImage({
    src,
    alt,
    labelClassName,
    ratio,
    borderRadius,
    width,
    height

}:IGRPImageProps){
    const ratioNumber = {
        '1/1':1/1,
        '4/3':4/3,
        '16/9':16/9 ,
        '21/9':21/9,
      }[ratio]

    var useFill=!width

    const Img = useFill ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn('object-cover object-center', borderRadius, labelClassName)}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn('object-cover object-center', borderRadius, labelClassName)}
        />
      );

return(
    <div className='flex justify-center'> 
        {ratio ? 
            (<AspectRatio ratio={ratioNumber}>
                {Img}
            </AspectRatio>
            ):(
                Img
            ) 
        }       
    </div>
)
}
export { IGRPImage,type IGRPImageProps }
