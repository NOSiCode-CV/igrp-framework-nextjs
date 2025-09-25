

import type { IGRPImageAttributes } from '../../../types'
import Image from 'next/image'
interface IGRPImageProps extends IGRPImageAttributes {
    src: string; 
    alt: string;
    width: number;
    height: number;
    labelClassName:string;
}

function IGRPImage({
    src,
    width,
    height,
    alt,
    labelClassName,

}:IGRPImageProps){
return(
        <Image src={src} alt={alt} width={width} height={height} className={labelClassName}/>
)
}
export { IGRPImage,type IGRPImageProps }
