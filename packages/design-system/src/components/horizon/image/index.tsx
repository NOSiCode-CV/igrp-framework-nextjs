import  { AspectRatio} from '@radix-ui/react-aspect-ratio';
import type { IGRPImageAttributes } from '../../../types'
import Image from 'next/image'
import { cn } from '../../../lib/utils';

interface IGRPImageProps extends IGRPImageAttributes {
    src: string; 
    alt: string;
    labelClassName:string;
    ratio:number;
    borderRadius?: 'rounded-none' | 'rounded-sm' | 'rounded' | 'rounded-md' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full';
}

function IGRPImage({
    src,
    alt,
    labelClassName,
    ratio,
    borderRadius

}:IGRPImageProps){
    const ratioNumber = {
        '1/1':1/1,
        '4/3':4/3,
        '16/9':16/9 ,
        '21/9':21/9,
      }[ratio]

return(
    <AspectRatio ratio={ratioNumber}>
        <Image src={src} alt={alt} fill className={cn('h-full w-full object-cover',borderRadius ,labelClassName)}/>
    </AspectRatio>
)
}
export { IGRPImage,type IGRPImageProps }
