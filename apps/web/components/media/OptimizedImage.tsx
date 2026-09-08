import Image, { type ImageProps } from 'next/image'
import { optimizedSrc } from '@/lib/optimized-image'

export function OptimizedImage({ src, ...props }: ImageProps) {
  const resolved = typeof src === 'string' ? optimizedSrc(src) : src
  return <Image src={resolved} {...props} />
}
